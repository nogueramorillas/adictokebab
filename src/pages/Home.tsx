import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MapPin, Instagram, Clock, ChevronRight, CheckCircle2, ShoppingBag, Plus, Minus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CheckoutForm from "@/components/CheckoutForm";
import DurumOptionsDialog from "@/components/DurumOptionsDialog";
import PlatoOptionsDialog, { type PlatoItem } from "@/components/PlatoOptionsDialog";
import MeatSelectionDialog, { type MeatItem } from "@/components/MeatSelectionDialog";
import { MENU, isDurum, isPlato } from "@/lib/menu";
import { useLocation } from "wouter";
import { useAuthMe, useAuthLogout } from "@/api";

function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
}

// Marca propia de Adicto Kebab: brocheta estilizada, sin depender de fotos de stock.
function KebabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="20" rx="17" ry="10" fill="currentColor" />
      <ellipse cx="50" cy="39" rx="19" ry="10" fill="currentColor" opacity="0.85" />
      <ellipse cx="50" cy="58" rx="17" ry="10" fill="currentColor" opacity="0.7" />
      <ellipse cx="50" cy="76" rx="15" ry="9" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("c/ d'Atenes 11, Mataró");
const instagram = "https://www.instagram.com/adictoesp/";

function MenuItem({ name, price, desc, onClick }: { name: string, price: string, desc?: string, onClick: () => void }) {
  return (
    <div
      className="flex justify-between items-start py-3 border-b border-border/50 last:border-0 hover:bg-card/50 transition-colors cursor-pointer rounded-lg px-2 -mx-2 group"
      onClick={onClick}
      data-testid={`menu-item-${name.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex-1 pr-3">
        <span className="font-medium text-foreground group-active:scale-[0.98] transition-transform block">{name}</span>
        {desc && <span className="text-xs text-muted-foreground mt-0.5 block leading-snug">{desc}</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-primary font-bold">{price}</span>
        <button className="bg-primary/10 text-primary p-1.5 rounded-full group-active:scale-[0.90] transition-transform">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title, expanded, onToggle }: { title: string, expanded: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4 border-l-4 border-primary pl-3">
      <h3 className="font-display text-2xl font-bold text-foreground/90 uppercase tracking-tight">{title}</h3>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-full shrink-0 ml-3"
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Ver menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver opciones</>}
      </button>
    </div>
  );
}

function Section({ title, items, onSelect, preview = 2 }: { title: string, items: {name: string, price: string, desc?: string}[], onSelect: (item: {name: string, price: string}) => void, preview?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, preview);

  return (
    <div className="mb-10">
      <SectionHeader title={title} expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        {visible.map((item, i) => (
          <MenuItem key={i} name={item.name} price={item.price} desc={item.desc} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}

const MIN_ORDER = 10;

function CartDrawer() {
  const { items, updateQuantity, removeItem, total, isOpen, setIsOpen } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setIsCheckingOut(false);
    }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-border bg-background">
        <SheetHeader className="p-6 border-b border-border/50 text-left">
          <SheetTitle className="font-display text-2xl font-black uppercase flex items-center gap-2">
            Tu Pedido
          </SheetTitle>
        </SheetHeader>
        
        {isCheckingOut ? (
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => setIsCheckingOut(false)} className="hover:text-foreground underline">Volver al carrito</button>
              </div>
              <CheckoutForm onComplete={() => {
                setIsOpen(false);
                setIsCheckingOut(false);
              }} />
            </div>
          </ScrollArea>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-4">
            <ShoppingBag className="w-12 h-12 opacity-20" />
            <p>Tu carrito está vacío.</p>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="mt-4">
              Ver el menú
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
                    <div className="flex-1 pr-4">
                      <p className="font-bold leading-tight">{item.name}</p>
                      <p className="text-primary font-medium text-sm mt-1">{(item.priceNum * item.quantity).toFixed(2).replace('.', ',')}€</p>
                    </div>
                    <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        className="p-1.5 hover:bg-card rounded-md transition-colors"
                        data-testid={`cart-minus-${item.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-bold text-sm" data-testid={`cart-qty-${item.name}`}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity + 1)}
                        className="p-1.5 hover:bg-card rounded-md transition-colors"
                        data-testid={`cart-plus-${item.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.name)}
                      className="ml-3 p-2 text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`cart-remove-${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-6 border-t border-border bg-card mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-muted-foreground">Total</span>
                <span className="font-display font-black text-2xl text-primary">{total.toFixed(2).replace('.', ',')}€</span>
              </div>
              {total < MIN_ORDER && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium text-center mb-4">
                  🛵 Pedido mínimo a domicilio: <strong>10,00€</strong><br />
                  <span className="text-xs font-normal opacity-80">Te faltan {(MIN_ORDER - total).toFixed(2).replace('.', ',')}€ para llegar al mínimo</span>
                </div>
              )}
              <Button
                className="w-full py-6 text-lg font-bold uppercase tracking-wide"
                size="lg"
                onClick={() => setIsCheckingOut(true)}
                disabled={total < MIN_ORDER}
                data-testid="button-checkout"
              >
                Completar Pedido
              </Button>
              <Button 
                variant="outline"
                className="w-full mt-3 font-bold"
                onClick={() => setIsOpen(false)}
                data-testid="button-keep-shopping"
              >
                Seguir comprando
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

type ApiMenuItem = { name: string; price: string; desc?: string; meatOptions?: string[]; menuPrice?: string; active?: boolean };
type ApiMenuData = Record<string, ApiMenuItem[]>;

function useApiMenu() {
  const [menu, setMenu] = useState<ApiMenuData | null>(null);
  useEffect(() => {
    fetch("/api/menu", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: ApiMenuData | null) => { if (data) setMenu(data); })
      .catch(() => {});
  }, []);
  return menu;
}

export default function Home() {
  useDarkMode();
  const apiMenu = useApiMenu();
  const [scrolled, setScrolled] = useState(false);
  const [durumItem, setDurumItem] = useState<{ name: string; price: string; meatOptions?: string[] } | null>(null);
  const [platoItem, setPlatoItem] = useState<PlatoItem | null>(null);
  const [meatItem, setMeatItem] = useState<MeatItem | null>(null);
  const { addItem, items, setIsOpen, total } = useCart();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const _logout = useAuthLogout();
  void _logout;
  const [location] = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auth, setAuth] = useState<Record<string, any> | null>(null);

  // Helper to get menu items from API or fallback to static
  const getItems = (cat: keyof typeof MENU): ApiMenuItem[] => {
    if (apiMenu && apiMenu[cat]) {
      return (apiMenu[cat] as ApiMenuItem[]).filter((i) => i.active !== false);
    }
    return MENU[cat] as ApiMenuItem[];
  };

useEffect(() => {
  fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  })
    .then(res => res.json())
    .then(data => {
      setAuth(data);
    });
}, []);

  console.log("AUTH:", auth);
  const handleAdd = (item: any) => {
    if (isDurum(item.name)) return setDurumItem({ name: item.name, price: item.price, meatOptions: item.meatOptions });
    if (isPlato(item.name) && item.menuPrice) return setPlatoItem({ name: item.name, price: item.price, menuPrice: item.menuPrice, meatOptions: item.meatOptions });
    if (item.meatOptions?.length) return setMeatItem({ name: item.name, price: item.price, meatOptions: item.meatOptions });
    addItem(item);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
  if (location.includes("cart=open")) {
    setIsOpen(true);
  }
}, [location]);

  return (
    <div className="min-h-[100dvh] w-full bg-background font-sans selection:bg-primary/30 text-foreground pb-24 md:pb-0 relative">
      
      {/* Mobile-first centered container */}
      <div className="max-w-[500px] mx-auto w-full min-h-screen shadow-2xl bg-background relative overflow-hidden flex flex-col border-x border-border/30">
        
        {/* Floating Cart Sticky Button */}
        <div className={`fixed md:absolute bottom-6 left-0 right-0 px-4 z-40 transition-all duration-300 ${scrolled || totalItems > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          {totalItems > 0 ? (
            <button 
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-between w-full bg-primary text-primary-foreground py-4 px-6 rounded-full font-bold text-lg shadow-[0_8px_30px_rgba(255,87,34,0.4)] active:scale-[0.98] transition-transform"
              data-testid="button-floating-cart"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">{totalItems}</span>
              </div>
              <span>Ver Pedido</span>
              <span>{total.toFixed(2).replace('.', ',')}€</span>
            </button>
          ) : (
            <button
              onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 rounded-full font-bold text-lg shadow-[0_8px_30px_rgba(234,88,12,0.4)] active:scale-[0.98] transition-transform"
              data-testid="button-sticky-order"
            >
              <ShoppingBag className="w-6 h-6" />
              Hacer Pedido
            </button>
          )}
        </div>

        {/* Hero Section — identidad gráfica propia (negro + rojo), sin fotos prestadas */}
        <header className="relative w-full aspect-[4/5] min-h-[450px] flex flex-col justify-end p-6 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-background" />
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
            <KebabIcon className="w-72 h-72 text-primary" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

          <div className="relative z-20 flex flex-col gap-4">
            <div className="inline-flex items-center justify-between w-full">
              <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold tracking-wide uppercase">Pide online ahora</span>
              </div>
              <Link href="/admin" className="text-white/50 hover:text-white text-xs underline underline-offset-4">Staff</Link>
            </div>
            
            <h1 className="font-display text-5xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-lg">
              ADICTO <span className="text-primary">KEBAB</span>
            </h1>
           {!auth ? null : auth.authenticated ? (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-white font-semibold">
      Hola, {auth?.username}
    </span>

    <a href="/mis-pedidos" className="text-sm text-primary">
      Mis pedidos
    </a>

    <button
      onClick={async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  window.location.reload();
}}
      className="text-sm text-red-500"
    >
      Cerrar sesión
    </button>
  </div>
) : (
  <a href="/login" className="text-sm text-primary">
    Iniciar sesión
  </a>
)}
            <p className="text-lg text-white/80 font-medium leading-snug">
              El pecado está servido. Haz tu pedido directamente desde aquí.
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={() => {
                  document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 bg-primary text-primary-foreground flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
                data-testid="button-hero-order"
              >
                <ShoppingBag className="w-5 h-5" />
                Hacer Pedido
              </button>
              <a 
                href={mapsUrl} target="_blank" rel="noreferrer"
                className="w-14 h-14 flex items-center justify-center bg-card text-foreground rounded-xl border border-border/50 shadow-sm active:scale-[0.98] transition-all"
                data-testid="button-hero-maps"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pt-8 pb-12 flex flex-col">
          
          {/* Quick Info */}
          <div className="grid grid-cols-1 gap-3 mb-10">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="bg-card p-3 rounded-2xl border border-border flex flex-col gap-1 items-start active:scale-95 transition-transform" data-testid="link-info-location">
              <div className="bg-primary/10 p-2 rounded-full text-primary mb-1">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Mercado Cerdanyola, Local 5 · Mataró</span>
              <span className="text-xs text-muted-foreground">c/ d'Atenes 11 · Ver mapa</span>
            </a>
          </div>

          {/* Lo más pedido */}
          <div className="mb-12">
            <h2 className="font-display text-3xl font-black mb-6 flex items-center gap-2 tracking-tight">
              LO MÁS PEDIDO 🔥
            </h2>
            
            <div className="flex flex-col gap-5">
              {MENU.destacados.map((item, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col" data-testid={`card-featured-${i}`}>
                  <div className="w-full relative bg-gradient-to-br from-black via-neutral-900 to-black px-5 py-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-4xl">
                        {item.icon}
                      </div>
                      <h3 className="font-display font-bold text-white text-xl leading-tight">{item.name}</h3>
                    </div>
                    <span className="bg-primary text-white font-black px-2.5 py-1 rounded-lg text-sm shadow-md shrink-0">{item.price}</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground leading-snug">{item.desc}</p>
                    <button 
                      onClick={() => handleAdd(item)}
                      className="w-full py-2.5 rounded-xl bg-card border-2 border-primary/30 text-primary font-bold flex justify-center items-center gap-2 active:bg-primary/10 transition-colors"
                      data-testid={`button-add-featured-${i}`}
                    >
                      <Plus className="w-4 h-4" />
                      Añadir al pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="menu-section" className="w-full h-px bg-border my-8" />

          {/* Menu Completo */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <h2 className="font-display text-3xl font-black tracking-tight">EL MENÚ</h2>
              <div className="h-1 flex-1 bg-border/50 ml-4 rounded-full" />
            </div>

            <Section title="Durum 🌯" items={getItems("durum")} onSelect={handleAdd} />
            <Section title="Menús 🔥" items={getItems("menus")} onSelect={handleAdd} />
            <Section title="Patatas 🍟" items={getItems("patatas")} onSelect={handleAdd} />
            <Section title="Fingers de Pollo 🍗" items={getItems("fingers")} onSelect={handleAdd} />
            <Section title="Combinado 🍽️" items={getItems("combinado")} onSelect={handleAdd} />
            <Section title="Postres 🍫" items={getItems("postres")} onSelect={handleAdd} />
            <Section title="Bebidas 🥤" items={getItems("bebidas")} onSelect={handleAdd} />
            <Section title="Salsas 🌶️" items={getItems("salsas")} onSelect={handleAdd} preview={4} />
          </div>

        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-8 p-6 text-center pb-28 md:pb-6">
          <div className="w-12 h-12 rounded-full bg-black border border-primary/40 flex items-center justify-center mx-auto mb-3">
            <KebabIcon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display font-black text-2xl text-primary mb-4 tracking-tighter">ADICTO KEBAB</h2>

          <div className="flex justify-center gap-4 mb-6">
            <a href={instagram} target="_blank" rel="noreferrer" className="bg-background p-2.5 rounded-full text-foreground/70 hover:text-primary transition-colors" data-testid="link-footer-ig">
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          <div className="text-xs text-muted-foreground flex flex-col gap-1 items-center">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> Mercado Cerdanyola, Local 5 · c/ d'Atenes 11, Mataró</span>
            <span className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> Lunes cerrado · Martes a domingo 14:00–24:00</span>
          </div>

          <div className="flex justify-center gap-4 mt-5 text-xs text-muted-foreground">
            <Link href="/privacidad" className="hover:text-primary transition-colors" data-testid="link-footer-privacy">
              Política de privacidad
            </Link>
            <span className="opacity-40">·</span>
            <Link href="/aviso-legal" className="hover:text-primary transition-colors" data-testid="link-footer-legal">
              Aviso legal
            </Link>
          </div>
        </footer>

      </div>
      <CartDrawer />
      <DurumOptionsDialog item={durumItem} onClose={() => setDurumItem(null)} />
      <PlatoOptionsDialog item={platoItem} onClose={() => setPlatoItem(null)} />
      <MeatSelectionDialog item={meatItem} onClose={() => setMeatItem(null)} />
    </div>
  );
}
