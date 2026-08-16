import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Minus, X, ShoppingBag, Bike, UtensilsCrossed, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/lib/cart";
import { ADMIN_MENU, isDurum } from "@/lib/menu";
import CheckoutForm from "@/components/CheckoutForm";
import DurumOptionsDialog from "@/components/DurumOptionsDialog";
import { Button } from "@/components/ui/button";

type AdminCategory = { title: string; items: { name: string; price: string }[] };

function CategorySection({ category, onAdd }: { category: AdminCategory; onAdd: (item: { name: string; price: string }) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-card/80 transition-colors"
      >
        <span className="font-display font-bold text-base uppercase tracking-tight border-l-4 border-primary pl-3">
          {category.title}
        </span>
        <span className="flex items-center gap-1 text-primary text-xs font-bold">
          {open ? <><ChevronUp className="w-4 h-4" /> Cerrar</> : <><ChevronDown className="w-4 h-4" /> Ver</>}
        </span>
      </button>

      {open && (
        <div className="bg-background border-t border-border">
          {category.items.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onAdd(item)}
              className="w-full flex justify-between items-center py-3 px-4 border-b border-border/40 last:border-0 hover:bg-card/50 transition-colors text-left"
            >
              <span className="font-medium text-foreground">{item.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-primary font-bold">{item.price}</span>
                <span className="bg-primary/10 text-primary p-1.5 rounded-full">
                  <Plus className="w-4 h-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewOrderView({ onBack }: { onBack: () => void }) {
  const { items, addItem, updateQuantity, removeItem, total, clearCart } = useCart();
  const [durumItem, setDurumItem] = useState<{ name: string; price: string } | null>(null);
  const [orderMode, setOrderMode] = useState<"local" | "domicilio" | null>(null);

  const handleAdd = (item: { name: string; price: string }) =>
    isDurum(item.name) ? setDurumItem({ name: item.name, price: item.price }) : addItem(item);

  // Start every staff order from a clean cart, and clear again on exit so a
  // half-built staff order never leaks into the customer-facing cart.
  useEffect(() => {
    clearCart();
    return () => clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pantalla de selección de tipo de pedido
  if (!orderMode) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <h1 className="font-display font-black text-lg tracking-tight">NUEVO PEDIDO</h1>
          </div>
        </header>
        <main className="max-w-sm mx-auto p-8 py-16 flex flex-col gap-6 items-center">
          <p className="text-muted-foreground font-medium text-center">¿Qué tipo de pedido es?</p>
          <button
            onClick={() => setOrderMode("local")}
            className="w-full flex items-center gap-5 p-6 bg-card border-2 border-primary rounded-2xl hover:bg-primary/10 transition-colors text-left"
          >
            <UtensilsCrossed className="w-10 h-10 text-primary shrink-0" />
            <div>
              <p className="font-display font-black text-xl">Local</p>
              <p className="text-sm text-muted-foreground">Cliente en el restaurante. Sin dirección, sin mínimo.</p>
            </div>
          </button>
          <button
            onClick={() => setOrderMode("domicilio")}
            className="w-full flex items-center gap-5 p-6 bg-card border-2 border-border rounded-2xl hover:bg-card/80 transition-colors text-left"
          >
            <Bike className="w-10 h-10 text-muted-foreground shrink-0" />
            <div>
              <p className="font-display font-black text-xl">Domicilio</p>
              <p className="text-sm text-muted-foreground">Entrega a domicilio. Requiere dirección y mínimo 10€.</p>
            </div>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setOrderMode(null)} className="text-muted-foreground" data-testid="button-neworder-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <h1 className="font-display font-black text-lg tracking-tight flex items-center gap-2">
            {orderMode === "local" ? <><UtensilsCrossed className="w-4 h-4 text-primary" /> PEDIDO LOCAL</> : <><Bike className="w-4 h-4" /> PEDIDO A DOMICILIO</>}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* Menu */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-black mb-4">Menú</h2>
          {ADMIN_MENU.map((category) => (
            <CategorySection key={category.title} category={category} onAdd={handleAdd} />
          ))}
        </div>

        {/* Cart + checkout */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-display text-2xl font-black">Comanda</h2>

          {items.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <ShoppingBag className="w-10 h-10 opacity-20" />
              <p className="font-medium">Añade productos desde el menú</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
                    <div className="flex-1 pr-3">
                      <p className="font-bold leading-tight">{item.name}</p>
                      <p className="text-primary font-medium text-sm mt-1">
                        {(item.priceNum * item.quantity).toFixed(2).replace(".", ",")}€
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                      <button
                        onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        className="p-1.5 hover:bg-card rounded-md transition-colors"
                        data-testid={`admin-cart-minus-${item.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-bold text-sm" data-testid={`admin-cart-qty-${item.name}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.name, item.quantity + 1)}
                        className="p-1.5 hover:bg-card rounded-md transition-colors"
                        data-testid={`admin-cart-plus-${item.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.name)}
                      className="ml-3 p-2 text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`admin-cart-remove-${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                <span className="font-bold text-muted-foreground">Total</span>
                <span className="font-display font-black text-2xl text-primary">{total.toFixed(2).replace(".", ",")}€</span>
              </div>

              <div className="bg-card p-4 rounded-xl border border-border">
                <CheckoutForm
                  onComplete={onBack}
                  successTitle="¡Pedido creado!"
                  successMessage="El pedido se ha registrado como pendiente. Pulsa Finalizar cuando esté cobrado para sumarlo a los ingresos."
                  completeLabel="Volver a pedidos"
                  showPrivacyConsent={false}
                  showTrackingLink={false}
                  isLocal={orderMode === "local"}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <DurumOptionsDialog item={durumItem} onClose={() => setDurumItem(null)} />
    </div>
  );
}
