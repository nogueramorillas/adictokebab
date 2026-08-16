import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { DURUM_INGREDIENTS, DURUM_SAUCES, buildDurumName } from "@/lib/menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type DurumItem = { name: string; price: string; meatOptions?: string[] };

export default function DurumOptionsDialog({
  item,
  onClose,
}: {
  item: DurumItem | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [meat, setMeat] = useState<string | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [sauces, setSauces] = useState<string[]>([]);

  // Reset selections whenever a new durum is opened.
  useEffect(() => {
    setMeat(null);
    setRemoved([]);
    setSauces([]);
  }, [item?.name]);

  const needsMeat = (item?.meatOptions?.length ?? 0) > 0;
  const canAdd = !needsMeat || meat !== null;

  const toggle = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  const handleAdd = () => {
    if (!item || !canAdd) return;
    const baseName = meat ? `${item.name} de ${meat}` : item.name;
    addItem({ name: buildDurumName(baseName, removed, sauces), price: item.price });
    onClose();
  };

  return (
    <Dialog open={item !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-black uppercase">
            {item?.name}
          </DialogTitle>
          <DialogDescription>
            Personaliza tu durum a tu gusto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {needsMeat && (
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Tipo de carne
              </h4>
              <div className="flex gap-2">
                {item!.meatOptions!.map((m) => (
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
          <Separator />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Quitar ingredientes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {DURUM_INGREDIENTS.map((ing) => (
                <label
                  key={ing}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid={`durum-ingredient-${ing.toLowerCase()}`}
                >
                  <Checkbox
                    checked={removed.includes(ing)}
                    onCheckedChange={() => toggle(ing, removed, setRemoved)}
                  />
                  <span className="font-medium text-sm">{ing}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Salsas
            </h4>
            <div className="grid gap-2">
              {DURUM_SAUCES.map((sauce) => (
                <label
                  key={sauce}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid={`durum-sauce-${sauce.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <Checkbox
                    checked={sauces.includes(sauce)}
                    onCheckedChange={() => toggle(sauce, sauces, setSauces)}
                  />
                  <span className="font-medium text-sm">{sauce}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full py-6 text-lg font-bold uppercase tracking-wide"
            data-testid="button-durum-add"
          >
            <Plus className="w-5 h-5 mr-2" /> Añadir al pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
