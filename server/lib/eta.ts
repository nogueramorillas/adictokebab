import { eq, and, isNull } from "drizzle-orm";
import { db, ordersTable } from "../db";
import { logger } from "./logger";

// --- Shop location (single source of truth for the delivery origin) ---------
// Adicto Kebab is in Mataró (Mercado Cerdanyola, Local 5). Coordinates can be
// overridden via env (SHOP_LAT / SHOP_LNG) without a code change; the defaults
// are the town centre.
const SHOP_LAT = Number(process.env.SHOP_LAT ?? "41.5388");
const SHOP_LNG = Number(process.env.SHOP_LNG ?? "2.4449");

// Kitchen prep buffer added on top of the driving time, in minutes.
const BASE_PREP_MINUTES = 15;
// How much "Retraso leve" pushes the ETA back, in minutes.
export const DELAY_BUMP_MINUTES = 10;
// Fallback ETA used when a delay is applied but no estimate exists yet.
export const DELAY_FALLBACK_MINUTES = 25;

// Free public services (no API key, no cost). Both can fail/throttle, so every
// call is best-effort and degrades to a manual ETA — it must never block or
// break order placement.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const USER_AGENT = "AdictoKebab/1.0 (order delivery ETA)";
const FETCH_TIMEOUT_MS = 4000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

type LatLng = { lat: number; lng: number };

async function geocode(query: string): Promise<LatLng | null> {
  const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`;
  const json = (await fetchJson(url)) as Array<{ lat?: string; lon?: string }> | null;
  if (!Array.isArray(json) || json.length === 0) return null;
  const lat = Number(json[0]?.lat);
  const lng = Number(json[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function drivingMinutes(from: LatLng, to: LatLng): Promise<number | null> {
  const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const json = (await fetchJson(url)) as
    | { routes?: Array<{ duration?: number }> }
    | null;
  const seconds = json?.routes?.[0]?.duration;
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  return seconds / 60;
}

/**
 * Estimate total delivery time in minutes (kitchen prep + driving from the
 * shop to the address). Returns null if the address can't be located or any
 * service fails — the caller then leaves the ETA for staff to set manually.
 */
export async function estimateEtaMinutes(parts: {
  street: string;
  streetNumber: string;
  town: string;
}): Promise<number | null> {
  try {
    const query = `${parts.street} ${parts.streetNumber}, ${parts.town}, España`;
    const dest = await geocode(query);
    if (!dest) return null;
    const minutes = await drivingMinutes({ lat: SHOP_LAT, lng: SHOP_LNG }, dest);
    if (minutes == null) return null;
    return Math.max(1, Math.round(BASE_PREP_MINUTES + minutes));
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget: compute the automatic ETA in the background and persist it
 * so order creation isn't blocked on external services. Safe to ignore the
 * returned promise; failures are logged and leave the ETA unset.
 */
export function scheduleEtaComputation(
  orderId: number,
  parts: { street: string; streetNumber: string; town: string },
): void {
  void (async () => {
    try {
      const minutes = await estimateEtaMinutes(parts);
      if (minutes == null) {
        logger.info({ orderId }, "Auto ETA unavailable; left for manual entry");
        return;
      }
      // Only fill in the ETA if it is still unset — never clobber a value that
      // staff set manually or a driver bumped via "Retraso leve" while the
      // background geocode was in flight.
      const updated = await db
        .update(ordersTable)
        .set({ etaMinutes: minutes, etaSource: "auto" })
        .where(and(eq(ordersTable.id, orderId), isNull(ordersTable.etaMinutes)))
        .returning({ id: ordersTable.id });
      if (updated.length === 0) {
        logger.info({ orderId }, "Auto ETA skipped; ETA already set");
        return;
      }
      logger.info({ orderId, minutes }, "Auto ETA computed");
    } catch (err) {
      logger.error({ orderId, err }, "Auto ETA computation failed");
    }
  })();
}
