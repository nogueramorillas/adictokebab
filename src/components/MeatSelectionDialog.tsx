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

export type MeatItem = { name: string; price: string; meatOptions: string[] };

export default function MeatSelectionDialog({
  item,
  onClose,
}: {
  item: MeatItem | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string | null>(null);

  if (!item) return null;

  function handleAdd() {
    if (!selected || !item) return;
    addItem({ name: `${item.name} de ${selected}`, price: item.price });
    setSelected(null);
    onClose();
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => { if (!open) { setSelected(null); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-black uppercase">
            {item.name}
          </DialogTitle>
          <DialogDescription>
            ¿Qué tipo de carne quieres?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {item.meatOptions.map((meat) => (
            <button
              key={meat}
              onClick={() => setSelected(meat)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                selected === meat
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="font-bold text-base">{meat}</span>
              {selected === meat && (
                <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handleAdd}
          disabled={!selected}
          className="w-full py-6 text-lg font-bold uppercase tracking-wide"
        >
          Añadir al pedido
        </Button>
        <Button variant="outline" onClick={() => { setSelected(null); onClose(); }} className="w-full">
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
