import { eq } from "drizzle-orm";
import { db, usersTable } from "../db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

const DRIVER_COUNT = 10;

/**
 * Idempotent startup seeding for the staff accounts.
 *
 * - Admin: taken from ADMIN_USERNAME / ADMIN_PASSWORD (env is the source of
 *   truth; the password is re-synced on every boot and is NOT editable from the
 *   panel).
 * - Drivers usuario1..usuario10: created only if missing, with a default
 *   password equal to the username and `passwordIsDefault = true` so the admin
 *   is prompted to change it. Existing drivers are never overwritten.
 */
export async function seedUsers(): Promise<void> {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (adminUser && adminPass) {
    const hash = await hashPassword(adminPass);
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, adminUser));
    if (existing) {
      await db
        .update(usersTable)
        .set({
          passwordHash: hash,
          role: "admin",
          active: true,
          passwordIsDefault: false,
        })
        .where(eq(usersTable.id, existing.id));
    } else {
      await db.insert(usersTable).values({
        username: adminUser,
        passwordHash: hash,
        role: "admin",
        displayName: "Administración",
        active: true,
        passwordIsDefault: false,
      });
    }
  } else {
    logger.warn(
      "ADMIN_USERNAME/ADMIN_PASSWORD not set; admin login will be unavailable until configured.",
    );
  }

  for (let i = 1; i <= DRIVER_COUNT; i++) {
    const username = `usuario${i}`;
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!existing) {
      const hash = await hashPassword(username);
      await db.insert(usersTable).values({
        username,
        passwordHash: hash,
        role: "driver",
        displayName: `Repartidor ${i}`,
        active: true,
        passwordIsDefault: true,
      });
    }
  }

  logger.info("User seeding complete");
}
