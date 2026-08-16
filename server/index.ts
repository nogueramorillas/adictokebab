import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { seedUsers } from "./lib/seed";
import { pool } from "./db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, "0.0.0.0", async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Crear tablas si no existen (evita depender de `drizzle-kit push` en el
  // primer arranque en un entorno nuevo, p.ej. un despliegue en Railway).
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        password_is_default BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        street TEXT NOT NULL,
        street_number TEXT NOT NULL,
        town TEXT NOT NULL,
        notes TEXT,
        items JSONB NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        payment_method TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        cash_amount DOUBLE PRECISION,
        status TEXT NOT NULL DEFAULT 'pending',
        privacy_consent_at TIMESTAMPTZ,
        tracking_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        eta_minutes INTEGER,
        eta_source TEXT,
        assigned_driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMPTZ,
        picked_up_at TIMESTAMPTZ,
        delivered_by_driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        delivered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    logger.info("Database tables ready");
  } catch (err) {
    logger.error({ err }, "Failed to create tables");
  }

  try {
    await seedUsers();
  } catch (err) {
    logger.error({ err }, "Seed error");
  }
});