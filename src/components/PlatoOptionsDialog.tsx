import { useState } from "react";
import { useCart } from "@/lib/cart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type PlatoItem = { name: string; price: string; menuPrice: string; meatOptions?: string[] };

export default function PlatoOptionsDialog({
  item,
  onClose,
}: {
  item: PlatoItem | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [meat, setMeat] = useState<string | null>(null);

  if (!item) return null;

  const needsMeat = (item.meatOptions?.length ?? 0) > 0;
  const baseName = meat ? `${item.name} de ${meat}` : item.name;

  function handleSolo() {
    if (needsMeat && !meat) return;
    addItem({ name: baseName, price: item!.price });
    setMeat(null);
    onClose();
  }

  function handleMenu() {
    if (needsMeat && !meat) return;
    addItem({ name: `${baseName} + Bebida`, price: item!.menuPrice });
    setMeat(null);
    onClose();
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => { if (!open) { setMeat(null); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-black uppercase">
            {item.name}
          </DialogTitle>
          <DialogDescription>
            {needsMeat && !meat ? "Primero elige el tipo de carne" : "¿Cómo lo quieres?"}
          </DialogDescription>
        </DialogHeader>

        {needsMeat && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Tipo de carne</p>
            <div className="flex gap-2 mb-2">
              {item.meatOptions!.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeat(m)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    meat === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 py-1">
          <button
            onClick={handleSolo}
            disabled={needsMeat && !meat}
            className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 active:scale-[0.98] transition-all text-left disabled:opacity-40 disabled:pointer-events-none"
          >
            <div>
              <p className="font-bold text-base">Solo el plato</p>
              <p className="text-sm text-muted-foreground mt-0.5">+ Ensalada + Patatas</p>
            </div>
            <span className="text-primary font-black text-lg ml-4">{item.price}</span>
          </button>

          <button
            onClick={handleMenu}
            disabled={needsMeat && !meat}
            className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all text-left disabled:opacity-40 disabled:pointer-events-none"
          >
            <div>
              <p className="font-bold text-base">Menú + Bebida</p>
              <p className="text-sm text-muted-foreground mt-0.5">Plato + refresco incluido</p>
            </div>
            <span className="text-primary font-black text-lg ml-4">{item.menuPrice}</span>
          </button>
        </div>

        <Button variant="outline" onClick={() => { setMeat(null); onClose(); }} className="w-full">
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
