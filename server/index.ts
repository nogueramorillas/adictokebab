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

  // Crear tabla settings si no existe
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    logger.info("Settings table ready");
  } catch (err) {
    logger.error({ err }, "Failed to create settings table");
  }

  try {
    await seedUsers();
  } catch (err) {
    logger.error({ err }, "Seed error");
  }
});