import { Router, type IRouter } from "express";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { type PgUpdateSetSource } from "drizzle-orm/pg-core";
import { db, ordersTable } from "../db";
import {
  ListMyOrdersResponse,
  UpdateMyOrderParams,
  UpdateMyOrderBody,
  UpdateMyOrderResponse,
} from "../zod";
import { requireDriver } from "../lib/auth";
import { DELAY_BUMP_MINUTES, DELAY_FALLBACK_MINUTES } from "../lib/eta";

const router: IRouter = Router();

// Statuses a driver still needs to act on (non-terminal, pre-delivery).
const DRIVER_ACTIVE_STATUSES = ["pending", "preparing", "ready"] as const;

// Driver: list orders assigned to me that still need delivering
router.get("/my-orders", requireDriver, async (req, res): Promise<void> => {
  const userId = req.currentUser!.id;
  const rows = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.assignedDriverId, userId),
        inArray(ordersTable.status, [...DRIVER_ACTIVE_STATUSES]),
      ),
    )
    .orderBy(desc(ordersTable.createdAt));
  res.json(ListMyOrdersResponse.parse(rows));
});

// Driver: advance one of my orders (picked up / delivered)
router.patch(
  "/my-orders/:id",
  requireDriver,
  async (req, res): Promise<void> => {
    const params = UpdateMyOrderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateMyOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const userId = req.currentUser!.id;
    const now = new Date();
    const updates: PgUpdateSetSource<typeof ordersTable> = {};
    if (parsed.data.action === "picked_up") {
      updates.pickedUpAt = now;
    } else if (parsed.data.action === "delay") {
      // "Retraso leve": push the ETA back a small fixed amount. If no estimate
      // exists yet, seed from a sensible fallback so the customer still sees one.
      updates.etaMinutes = sql`COALESCE(${ordersTable.etaMinutes}, ${DELAY_FALLBACK_MINUTES}) + ${DELAY_BUMP_MINUTES}`;
    } else {
      // delivered
      updates.status = "delivered";
      updates.deliveredAt = now;
      updates.deliveredByDriverId = userId;
    }

    // Atomic guard: only mutate when the order is still assigned to this driver
    // AND in a driver-actionable (non-terminal, pre-delivery) status. This
    // closes the TOCTOU window on reassignment and prevents drivers from
    // reverting already delivered/completed/cancelled orders.
    const updated = await db
      .update(ordersTable)
      .set(updates)
      .where(
        and(
          eq(ordersTable.id, params.data.id),
          eq(ordersTable.assignedDriverId, userId),
          inArray(ordersTable.status, [...DRIVER_ACTIVE_STATUSES]),
        ),
      )
      .returning();

    if (updated.length === 0) {
      // Distinguish "not yours / not actionable" from "doesn't exist" for a
      // clearer client message, without leaking other drivers' orders.
      const [exists] = await db
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.id, params.data.id));
      if (!exists) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }
      res
        .status(409)
        .json({ error: "Este pedido no está asignado a ti o ya no es editable" });
      return;
    }

    res.json(UpdateMyOrderResponse.parse(updated[0]));
  },
);

export default router;
