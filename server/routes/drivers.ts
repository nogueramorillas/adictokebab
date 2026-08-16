import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, usersTable } from "../db";
import {
  ListDriversResponse,
  UpdateDriverParams,
  UpdateDriverBody,
  UpdateDriverResponse,
} from "../zod";
import { requireAdmin, hashPassword } from "../lib/auth";

const router: IRouter = Router();

// Admin: list driver accounts
router.get("/drivers", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "driver"))
    .orderBy(asc(usersTable.id));
  // Zod strips passwordHash (not part of the Driver schema).
  res.json(ListDriversResponse.parse(rows));
});

// Admin: update a driver (display name, active flag, password)
router.patch("/drivers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!existing || existing.role !== "driver") {
    res.status(404).json({ error: "Repartidor no encontrado" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined) {
    updates.displayName = parsed.data.displayName;
  }
  if (parsed.data.active !== undefined) {
    updates.active = parsed.data.active;
  }
  if (parsed.data.password !== undefined && parsed.data.password.length > 0) {
    updates.passwordHash = await hashPassword(parsed.data.password);
    updates.passwordIsDefault = false;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No hay cambios que aplicar" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  res.json(UpdateDriverResponse.parse(updated));
});

export default router;
