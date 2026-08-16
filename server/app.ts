import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COOKIE_SECRET = process.env.SESSION_SECRET;
if (!COOKIE_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Refusing to start: signed admin cookies require a strong secret.",
  );
}

const app: Express = express();

app.set("trust proxy", true);

// Logger
app.use((req, _res, next) => {
  req.log = logger;
  next();
});

// ✅ CORS BIEN CONFIGURADO
app.use(cors({
  origin: [
    "https://adictokebab.vercel.app",
    "https://adictokebab-production.up.railway.app",
    "http://localhost:5173"
  ],
  credentials: true,
}));

// Middlewares
app.use(cookieParser(COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoints
app.get("/api/test", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api", router);

// Servir frontend estático (build de Vite) en producción
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;