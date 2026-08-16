import { CheckCircle2, Clock, ChefHat, Bike } from "lucide-react";

const steps = [
  { key: "pending",    label: "Recibido",  icon: Clock },
  { key: "preparing", label: "En cocina",  icon: ChefHat },
  { key: "ready",     label: "En camino",  icon: Bike },
  { key: "delivered", label: "Entregado",  icon: CheckCircle2 },
];

function stepColor(index: number, currentIndex: number) {
  if (index > currentIndex) return "bg-muted text-muted-foreground border-border";
  // Colores por etapa: naranja → verde → azul → verde oscuro
  if (index === 0) return "bg-orange-500 text-white border-orange-500";
  if (index === 1) return "bg-green-500 text-white border-green-500";
  if (index === 2) return "bg-blue-500 text-white border-blue-500";
  return "bg-emerald-600 text-white border-emerald-600";
}

function lineColor(index: number, currentIndex: number) {
  if (index >= currentIndex) return "bg-muted";
  if (index === 0) return "bg-green-500";
  if (index === 1) return "bg-blue-500";
  return "bg-emerald-600";
}

export default function OrderTracking({ status }: { status: string }) {
  const currentIndex = steps.findIndex(s => s.key === status);
  const idx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-start gap-0">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index <= idx;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div className={`h-1 flex-1 ${lineColor(index - 1, idx)}`} />
              )}
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 shrink-0 transition-colors
                  ${active ? stepColor(index, idx) : "bg-muted text-muted-foreground border-border"}`}
              >
                <Icon size={18} />
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 ${lineColor(index, idx)}`} />
              )}
            </div>
            <span className={`text-xs mt-1.5 text-center font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
