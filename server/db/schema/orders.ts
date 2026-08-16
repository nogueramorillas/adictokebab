import {
  pgTable,
  serial,
  text,
  doublePrecision,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  street: text("street").notNull(),
  streetNumber: text("street_number").notNull(),
  town: text("town").notNull(),
  notes: text("notes"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  total: doublePrecision("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  userId: integer("user_id").references(() => usersTable.id, {
  onDelete: "set null",}),
  cashAmount: doublePrecision("cash_amount"),
  status: text("status").notNull().default("pending"),
  privacyConsentAt: timestamp("privacy_consent_at", { withTimezone: true }),
  // Public customer tracking: unguessable token used in the no-login tracking
  // URL. DB-generated so it always exists and backfills any existing rows.
  trackingToken: text("tracking_token")
    .notNull()
    .unique()
    .default(sql`gen_random_uuid()`),
  // Estimated delivery time in minutes from createdAt. Computed automatically
  // (eta_source='auto') from the address, or set by staff ('manual'). Null
  // means unknown (auto computation failed and staff hasn't set it yet).
  etaMinutes: integer("eta_minutes"),
  etaSource: text("eta_source"),
  // Delivery assignment + history (Sistema de repartidores)
  assignedDriverId: integer("assigned_driver_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  deliveredByDriverId: integer("delivered_by_driver_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
