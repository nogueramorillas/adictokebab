import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "../db";

const COOKIE_NAME = "tk_admin";
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 hours
const SALT_ROUNDS = 10;

const isProduction = process.env.NODE_ENV === "production";

export type SafeUser = Omit<User, "passwordHash">;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: SafeUser;
    }
  }
}

function stripPassword(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setAuthCookie(res: Response, userId: number): void {
  res.cookie("tk_admin", String(userId), {
  httpOnly: true,
  signed: true,
  sameSite: "lax",
  secure: true,
  path: "/",
});
}
export function clearAuthCookie(res: Response): void {
  res.cookie(COOKIE_NAME, "", {
  httpOnly: true,
  signed: true,
  sameSite: "lax",
  secure: true,
  expires: new Date(0),
  path: "/",
});
}

/** The user id encoded in the signed session cookie, if any. */
export function getSessionUserId(req: Request): number | null {
  const raw = req.signedCookies?.[COOKIE_NAME] || req.cookies?.[COOKIE_NAME];
  if (typeof raw !== "string" || raw.length === 0) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Best-effort "is there a logged-in session" check (cookie presence only, no DB
 * lookup). Used solely for the RGPD privacy-consent exemption on staff orders —
 * never as a real authorization gate.
 */
export function isAuthenticated(req: Request): boolean {
  return getSessionUserId(req) != null;
}

/** Resolve the active user behind the session cookie, or null. */
export async function getCurrentUser(req: Request): Promise<SafeUser | null> {
  const id = getSessionUserId(req);
  if (id == null) return null;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user || !user.active) return null;
  return stripPassword(user);
}

/** Require any active, logged-in user. Attaches `req.currentUser`. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Error de autenticación" });
  }
}

/** Require an active, logged-in driver. Attaches `req.currentUser`. */
export async function requireDriver(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (user.role !== "driver") {
      res.status(403).json({ error: "Acceso restringido" });
      return;
    }
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Error de autenticación" });
  }
}

/** Require an active, logged-in admin. Attaches `req.currentUser`. */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({ error: "Acceso restringido" });
      return;
    }
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Error de autenticación" });
  }
}
