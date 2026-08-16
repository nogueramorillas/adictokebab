import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "../db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

// Static fallback menu (no images, only data fields)
const STATIC_MENU = {
  destacados: [
    { name: "Durum Súper Grande", price: "5,99€", meatOptions: ["Pollo", "Ternera"], desc: "Pollo o Ternera con ensalada y nuestra salsa especial. El pecado está servido." },
    { name: "Menú Súper Grande", price: "8,99€", meatOptions: ["Pollo", "Ternera"], desc: "Durum Súper Grande + Patatas Súper Grande + Bebida." },
    { name: "Fingers de Pollo Súper Grande", price: "8,99€", desc: "Crujientes tiras de pollo rebozadas con patatas." },
  ],
  durum: [
    { name: "Durum Mini", price: "1,99€", meatOptions: ["Pollo", "Ternera"], desc: "Pollo o Ternera con ensalada" },
    { name: "Durum Mediano", price: "2,99€", meatOptions: ["Pollo", "Ternera"], desc: "Pollo o Ternera con ensalada" },
    { name: "Durum Súper Grande", price: "5,99€", meatOptions: ["Pollo", "Ternera"], desc: "Pollo o Ternera con ensalada" },
  ],
  patatas: [
    { name: "Patatas Mini", price: "0,99€", desc: "Patatas fritas crujientes" },
    { name: "Patatas Mediano", price: "1,99€", desc: "Patatas fritas crujientes" },
    { name: "Patatas Súper Grande", price: "2,99€", desc: "Patatas fritas crujientes" },
  ],
  fingers: [
    { name: "Fingers de Pollo Mediano", price: "6,99€", desc: "Tiras de pollo rebozadas y crujientes" },
    { name: "Fingers de Pollo Súper Grande", price: "8,99€", desc: "Tiras de pollo rebozadas y crujientes" },
  ],
  combinado: [
    { name: "Combinado Súper Grande", price: "3,99€", desc: "Patatas + 2 ingredientes a elegir" },
  ],
  postres: [
    { name: "Coulant de Chocolate (1u)", price: "1,99€", desc: "Coulant de chocolate caliente" },
    { name: "Coulant de Chocolate (2u)", price: "2,99€", desc: "Coulant de chocolate caliente" },
  ],
  menus: [
    { name: "Menú Mini", price: "3,99€", meatOptions: ["Pollo", "Ternera"], desc: "Durum Mini + Patatas Mini + Bebida" },
    { name: "Menú Mediano", price: "6,99€", meatOptions: ["Pollo", "Ternera"], desc: "Durum Mediano + Patatas Mediano + Bebida" },
    { name: "Menú Súper Grande", price: "8,99€", meatOptions: ["Pollo", "Ternera"], desc: "Durum Súper Grande + Patatas Súper Grande + Bebida" },
  ],
  bebidas: [
    { name: "Coca-Cola", price: "1,80€" },
    { name: "Agua", price: "1,50€" },
    { name: "Fanta", price: "1,80€" },
  ],
  salsas: [
    { name: "Salsa Barbacoa", price: "0,50€" },
    { name: "Salsa Alioli", price: "0,50€" },
    { name: "Salsa Curry", price: "0,50€" },
    { name: "Salsa Mostaza", price: "0,50€" },
    { name: "Salsa de Mango", price: "0,50€" },
    { name: "Salsa de Cilantro", price: "0,50€" },
    { name: "Salsa Miel y Mostaza", price: "0,50€" },
    { name: "Salsa de Piña", price: "0,50€" },
    { name: "Salsa Agridulce", price: "0,50€" },
  ],
};

// Public: get menu
router.get("/menu", async (_req, res): Promise<void> => {
  try {
    const [row] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "menu"));

    if (row?.value) {
      res.json(row.value);
    } else {
      res.json(STATIC_MENU);
    }
  } catch {
    // Table may not exist yet — return static fallback
    res.json(STATIC_MENU);
  }
});

// Admin: save menu
router.put("/menu", requireAdmin, async (req, res): Promise<void> => {
  const menuData = req.body;
  if (!menuData || typeof menuData !== "object") {
    res.status(400).json({ error: "Cuerpo de la petición inválido" });
    return;
  }

  try {
    await db
      .insert(settingsTable)
      .values({ key: "menu", value: menuData, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value: menuData, updatedAt: new Date() },
      });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error saving menu:", err);
    res.status(503).json({ error: "No se pudo guardar la carta. La tabla de configuración puede no existir aún." });
  }
});

export default router;
