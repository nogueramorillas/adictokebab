export type MenuItemData = { name: string; price: string; meatOptions?: string[] };

export const MENU = {
  destacados: [
    { name: "Durum Súper Grande", price: "5,99€", meatOptions: ["Pollo", "Ternera"], desc: "Pollo o Ternera con ensalada y nuestra salsa especial. El pecado está servido.", icon: "🌯" },
    { name: "Menú Súper Grande", price: "8,99€", meatOptions: ["Pollo", "Ternera"], desc: "Durum Súper Grande + Patatas Súper Grande + Bebida.", icon: "🔥" },
    { name: "Fingers de Pollo Súper Grande", price: "8,99€", desc: "Crujientes tiras de pollo rebozadas con patatas.", icon: "🍗" },
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

// Flat, categorised menu used by the staff "Nuevo Pedido" builder. Includes the
// featured dishes so every sellable item is reachable.
export const ADMIN_MENU: { title: string; items: MenuItemData[] }[] = [
  { title: "Destacados", items: MENU.destacados.map(({ name, price }) => ({ name, price })) },
  { title: "Durum", items: MENU.durum.map(({ name, price }) => ({ name, price })) },
  { title: "Patatas", items: MENU.patatas },
  { title: "Fingers de Pollo", items: MENU.fingers },
  { title: "Combinado", items: MENU.combinado },
  { title: "Postres", items: MENU.postres },
  { title: "Menús", items: MENU.menus.map(({ name, price }) => ({ name, price })) },
  { title: "Bebidas", items: MENU.bebidas },
  { title: "Salsas", items: MENU.salsas },
];

// ---- Durum customisation ----
// Ingredients a customer can remove and sauces they can add. Choices are encoded
// into the cart item name (e.g. "Durum Mini de Pollo (sin Cebolla · Salsa picante)")
// so they flow through to the kitchen comanda without any schema change.
export const DURUM_INGREDIENTS = ["Cebolla", "Lechuga", "Tomate", "Col lombarda"] as const;
export const DURUM_SAUCES = ["Salsa blanca", "Salsa picante"] as const;

export function isDurum(name: string): boolean {
  return name.toLowerCase().includes("durum");
}

export function isPlato(name: string): boolean {
  return name.toLowerCase().startsWith("plato");
}

export function buildDurumName(
  baseName: string,
  removed: string[],
  sauces: string[],
): string {
  // Canonicalise by the menu's own order so the same choices always serialise to
  // the same name regardless of click order — that's what lets the cart dedup.
  const orderedRemoved = DURUM_INGREDIENTS.filter((i) => removed.includes(i));
  const orderedSauces = DURUM_SAUCES.filter((s) => sauces.includes(s));
  const parts: string[] = [];
  if (orderedRemoved.length > 0) parts.push(orderedRemoved.map((r) => `sin ${r}`).join(", "));
  if (orderedSauces.length > 0) parts.push(orderedSauces.join(", "));
  return parts.length > 0 ? `${baseName} (${parts.join(" · ")})` : baseName;
}
