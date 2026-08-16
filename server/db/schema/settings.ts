import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
