import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { db, ordersTable, usersTable } from "../db";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  ListOrdersResponse,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  GetOrdersStatsResponse,
} from "../zod";
import { requireAdmin, isAuthenticated } from "../lib/auth";
import { scheduleEtaComputation } from "../lib/eta";
import { getCurrentUser } from "../lib/auth";

const router: IRouter = Router();

// --- Basic anti-spam (in-memory; fine for a single-instance local business) ---
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max orders per IP per window
const DEDUPE_WINDOW_MS = 30_000; // ignore identical re-submits within 30s
const ipHits = new Map<string, number[]>();
const recentOrders = new Map<string, number>();

function pruneOld(): void {
  const now = Date.now();
  for (const [ip, hits] of ipHits) {
    const fresh = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) ipHits.delete(ip);
    else ipHits.set(ip, fresh);
  }
  for (const [key, t] of recentOrders) {
    if (now - t > DEDUPE_WINDOW_MS) recentOrders.delete(key);
  }
}

// Public: create an order
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getCurrentUser(req);

  const data = parsed.data;

  // Honeypot: a hidden field no human ever fills. If present, drop it as spam.
  if (typeof data.website === "string" && data.website.trim().length > 0) {
    // Respond like a normal-ish rejection without revealing the trap.
    res.status(400).json({ error: "No se ha podido procesar el pedido" });
    return;
  }

  // RGPD: public/customer orders must accept the privacy policy. Staff orders
  // (authenticated admin via "Nuevo Pedido") are exempt — taken in person.
  const staff = isAuthenticated(req);
  if (!staff && data.acceptPrivacy !== true) {
    res
      .status(400)
      .json({ error: "Debes aceptar la política de privacidad para realizar el pedido" });
    return;
  }

  pruneOld();
  const now = Date.now();

  // Rate limit per IP (req.ip is the real client thanks to `trust proxy`).
  const ip = req.ip ?? "unknown";
  const hits = ipHits.get(ip) ?? [];
  if (hits.length >= RATE_LIMIT_MAX) {
    res
      .status(429)
      .json({ error: "Demasiados pedidos seguidos. Espera un momento e inténtalo de nuevo." });
    return;
  }

  // Dedupe accidental double-submits (same phone + total + item count).
  const dedupeKey = `${data.phone}|${data.total}|${data.items.length}`;
  const last = recentOrders.get(dedupeKey);
  if (last != null && now - last < DEDUPE_WINDOW_MS) {
    res
      .status(429)
      .json({ error: "Ya hemos recibido tu pedido. Espera unos segundos antes de repetirlo." });
    return;
  }

  // Server-side order invariants (defend against tampered/inconsistent payloads)
  if (data.items.length === 0) {
    res.status(400).json({ error: "El pedido no contiene artículos" });
    return;
  }
  const itemsValid = data.items.every(
    (i) => i.price >= 0 && Number.isInteger(i.quantity) && i.quantity > 0,
  );
  if (!itemsValid) {
    res.status(400).json({ error: "Artículos del pedido no válidos" });
    return;
  }
  if (data.total <= 0) {
    res.status(400).json({ error: "El total del pedido no es válido" });
    return;
  }
  if (!data.notes || data.notes.trim().length === 0) {
    res.status(400).json({ error: "Faltan las indicaciones de entrega" });
    return;
  }
  if (data.paymentMethod === "cash") {
    if (data.cashAmount == null || data.cashAmount < data.total) {
      res
        .status(400)
        .json({ error: "El importe en efectivo debe ser igual o mayor que el total" });
      return;
    }
  } else if (data.cashAmount != null) {
    res
      .status(400)
      .json({ error: "El importe en efectivo no aplica para pago con tarjeta" });
    return;
  }

  // Order accepted: record it for rate-limit + dedupe windows.
  ipHits.set(ip, [...hits, now]);
  recentOrders.set(dedupeKey, now);

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerName: data.customerName,
      phone: data.phone,
      street: data.street,
      streetNumber: data.streetNumber,
      town: data.town,
      notes: data.notes ?? null,
      items: data.items,
      total: data.total,
      paymentMethod: data.paymentMethod,
      cashAmount: data.cashAmount ?? null,
      status: "pending",
      privacyConsentAt: data.acceptPrivacy === true ? new Date() : null,

      userId: user?.id ?? null,
    })
    .returning();

  // Respond immediately, then estimate the ETA in the background (best-effort,
  // free OpenStreetMap services). Never block order placement on it.
  scheduleEtaComputation(order.id, {
    street: order.street,
    streetNumber: order.streetNumber,
    town: order.town,
  });

  res.status(201).json(GetOrderResponse.parse(order));
});

// Staff: list orders
router.get("/orders", requireAdmin, async (req, res): Promise<void> => {
  try {
    const params = ListOrdersQueryParams.safeParse(req.query);

    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const status = params.data.status;
    const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;

    let dayStart: Date | undefined;
    let dayEnd: Date | undefined;
    if (dateParam) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
      if (match) {
        dayStart = new Date();
        dayStart.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        dayStart.setHours(0, 0, 0, 0);
        dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
      }
    }

    const buildWhere = () => {
      const conditions = [];
      if (status) conditions.push(eq(ordersTable.status, status));
      if (dayStart && dayEnd) {
        conditions.push(gte(ordersTable.createdAt, dayStart));
        conditions.push(lt(ordersTable.createdAt, dayEnd));
      }
      return conditions.length === 1
        ? conditions[0]
        : conditions.length > 1
        ? and(...conditions)
        : undefined;
    };

    const where = buildWhere();
    const rows = where
      ? await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt))
      : await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

    res.json(ListOrdersResponse.parse(rows));

  } catch (err) {
    console.error("🔥 ERROR EN /api/orders:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Staff: dashboard stats. Optional ?date=YYYY-MM-DD reports that day's
// counts/revenue (defaults to today). pendingCount/activeCount are always live.
router.get("/orders-stats", requireAdmin, async (req, res): Promise<void> => {
  const invalidDate = (): void => {
    res.status(400).json({ error: "Fecha no válida (formato esperado: AAAA-MM-DD)" });
  };

  // Reject arrays / non-string values, then require a real calendar date.
  if (req.query.date !== undefined && typeof req.query.date !== "string") {
    invalidDate();
    return;
  }
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
  let y: number | undefined;
  let m: number | undefined;
  let d: number | undefined;
  if (dateParam !== undefined) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (!match) {
      invalidDate();
      return;
    }
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  }

  // Resolve the selected day's [start, end) window in server-local time so it
  // matches how "today" was computed before. No date param => server-local today.
  const dayStart = new Date();
  if (y !== undefined) {
    dayStart.setFullYear(y, m! - 1, d!);
  }
  dayStart.setHours(0, 0, 0, 0);
  // Reject impossible dates (e.g. 2026-02-31) that JS would silently roll over.
  if (
    y !== undefined &&
    (dayStart.getFullYear() !== y ||
      dayStart.getMonth() !== m! - 1 ||
      dayStart.getDate() !== d!)
  ) {
    invalidDate();
    return;
  }
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const resolvedDate = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`;

  const all = await db.select().from(ordersTable);

  const pendingCount = all.filter((o) => o.status === "pending").length;
  const activeCount = all.filter(
    (o) =>
      o.status === "preparing" ||
      o.status === "ready" ||
      o.status === "delivered",
  ).length;
  const dayOrders = all.filter(
    (o) =>
      o.createdAt >= dayStart &&
      o.createdAt < dayEnd &&
      o.status !== "cancelled",
  );
  const todayCount = dayOrders.length;
  // Income (green total) only counts finalised/charged orders ("completed").
  const todayRevenue = dayOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  // Top products from items JSON
  const productMap = new Map<string, { count: number; revenue: number }>();
  for (const order of dayOrders) {
    if (!Array.isArray(order.items)) continue;
    for (const item of order.items as { name: string; price: number; quantity: number }[]) {
      const existing = productMap.get(item.name) ?? { count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      productMap.set(item.name, existing);
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, { count, revenue }]) => ({ name, count, revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    ...GetOrdersStatsResponse.parse({
      pendingCount,
      activeCount,
      todayCount,
      todayRevenue,
      date: resolvedDate,
    }),
    topProducts,
  });
});

// Staff: get single order
router.get("/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  res.json(GetOrderResponse.parse(order));
});

// Staff: update order status
router.patch("/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, assignedDriverId, etaMinutes } = parsed.data;
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : undefined;
  if (phone !== undefined && phone.length < 6) {
    res.status(400).json({ error: "Número de teléfono no válido" });
    return;
  }
  if (
    status === undefined &&
    assignedDriverId === undefined &&
    etaMinutes === undefined &&
    phone === undefined
  ) {
    res.status(400).json({ error: "No hay cambios que aplicar" });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  const updates: Partial<typeof ordersTable.$inferInsert> = {};

  if (assignedDriverId !== undefined) {
    if (assignedDriverId === null) {
      updates.assignedDriverId = null;
      updates.assignedAt = null;
    } else {
      const [driver] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, assignedDriverId));
      if (!driver || driver.role !== "driver" || !driver.active) {
        res.status(400).json({ error: "Repartidor no válido" });
        return;
      }
      updates.assignedDriverId = assignedDriverId;
      updates.assignedAt = new Date();
    }
  }

  if (etaMinutes !== undefined) {
    updates.etaMinutes = etaMinutes;
    updates.etaSource = etaMinutes === null ? null : "manual";
  }

  if (phone !== undefined) {
    updates.phone = phone;
  }

  if (status !== undefined) {
    updates.status = status;
    // Record delivery history when an admin marks an order delivered directly.
    if (status === "delivered" && !existing.deliveredAt) {
      updates.deliveredAt = new Date();
      updates.deliveredByDriverId =
        updates.assignedDriverId !== undefined
          ? updates.assignedDriverId
          : existing.assignedDriverId;
    }
  }

  const [order] = await db
    .update(ordersTable)
    .set(updates)
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  res.json(UpdateOrderResponse.parse(order));
});

export default router;