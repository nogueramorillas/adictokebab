import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db";
import {
  AuthLoginBody,
  AuthLoginResponse,
  AuthMeResponse,
} from "../zod";
import {
  verifyPassword,
  setAuthCookie,
  getCurrentUser,
  hashPassword,
} from "../lib/auth";

const router: IRouter = Router();

// 🔥 LOGIN
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Solicitud inválida" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.username));

  if (!user) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }

  if (!user.active) {
    res.status(403).json({ error: "Usuario desactivado" });
    return;
  }

const ok = await verifyPassword(parsed.data.password, user.passwordHash);

if (!ok) {
  res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  return;
}

// 🔥 ESTO ES CLAVE (SI FALTA, NUNCA HAY SESIÓN)
setAuthCookie(res, user.id);

// 🔥 SOLO UN RES.JSON
res.json({
  authenticated: true,
  role: user.role,
  username: user.username,
  displayName: user.displayName,
});
});

// 🔥 REGISTER (CLIENTES)
router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Faltan datos" });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing) {
    res.status(400).json({ error: "El usuario ya existe" });
    return;
  }

  const hash = await hashPassword(password);

  await db.insert(usersTable).values({
    username,
    passwordHash: hash,
    role: "customer",
    active: true,
  });

  res.json({ success: true });
});

// 🔥 LOGOUT (FIX DEFINITIVO)
router.post("/auth/logout", (_req, res): void => {
  res.cookie("tk_admin", "", {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: true,
    expires: new Date(0),
    path: "/",
  });

  res.json({ authenticated: false });
});

// 🔥 ME (sesión actual)
router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);

  if (!user) {
    res.json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    role: user.role,
    username: user.username,
    displayName: user.displayName,
    mustChangePassword:
      user.role === "driver" && user.passwordIsDefault,
  });
});

export default router;