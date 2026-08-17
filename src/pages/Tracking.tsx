import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Receipt,
  ChefHat,
  Bike,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import {
  useGetOrderTracking,
  getGetOrderTrackingQueryKey,
  type OrderTracking,
} from "@/api";
import OrderTrackingComponent from "@/components/OrderTracking";

function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}

const STAGES = [
  { key: "recibido", label: "Pedido recibido", icon: Receipt },
  { key: "preparando", label: "Preparando tu comida", icon: ChefHat },
  { key: "en_camino", label: "En camino", icon: Bike },
  { key: "entregado", label: "Entregado", icon: CheckCircle2 },
] as const;

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Tracking() {
  useDarkMode();
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  // Re-render every 30s so the "quedan ~N min" countdown stays fresh even
  // between server polls.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError } = useGetOrderTracking(token);

  return (
    <div className="min-h-[100dvh] w-full bg-background font-sans text-foreground selection:bg-primary/30">
      <div className="max-w-[500px] mx-auto w-full min-h-screen bg-background border-x border-border/30 flex flex-col">
        <header className="p-5 border-b border-border/50 flex items-center justify-between">
          <h1 className="font-display font-black text-xl tracking-tight">
            ADICTO<span className="text-primary">KEBAB</span>
          </h1>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
            data-testid="link-tracking-home"
          >
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
        </header>

        <main className="flex-1 p-5">
          {isLoading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isError || !data ? (
            <div className="py-24 text-center text-muted-foreground space-y-3">
              <XCircle className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-medium">No hemos encontrado este pedido.</p>
              <p className="text-sm">
                Comprueba el enlace que recibiste al hacer el pedido.
              </p>
            </div>
          ) : (
            <TrackingBody data={data} />
          )}
        </main>
      </div>
    </div>
  );
}

function TrackingBody({ data }: { data: OrderTracking }) {
  const cancelled = data.stage === "cancelado";
  const currentIndex = STAGES.findIndex((s) => s.key === data.stage);
  const delivered = data.stage === "entregado";

  let remainingMin: number | null = null;
  if (data.estimatedDeliveryAt) {
    const diff = new Date(data.estimatedDeliveryAt).getTime() - Date.now();
    remainingMin = Math.max(0, Math.round(diff / 60_000));
  }

  return (
    <div className="space-y-6">
      <OrderTrackingComponent status={data.stage} />
      <p className="text-center text-sm text-muted-foreground">
  Puedes cerrar esta página. Tu pedido seguirá actualizándose automáticamente.
</p>
<div className="flex justify-center">
  <a
    href="/"
    className="text-primary text-sm underline"
  >
    ← Volver a la tienda
  </a>
</div>
<div className="flex justify-center mt-4">
  <button
    onClick={() => {
      localStorage.removeItem("lastOrderToken");
      window.location.href = "/";
    }}
    className="text-xs text-muted-foreground hover:text-red-500"
  >
    Borrar seguimiento
  </button>
</div>
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Hola{data.customerName ? `, ${data.customerName}` : ""}
        </p>
        <h2 className="font-display text-3xl font-black mt-1">Tu pedido</h2>
      </div>

      {cancelled ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center space-y-2">
          <XCircle className="w-10 h-10 mx-auto text-destructive" />
          <p className="font-bold text-lg">Pedido cancelado</p>
          <p className="text-sm text-muted-foreground">
            Si crees que es un error, llámanos.
          </p>
        </div>
      ) : (
        <>
          {/* ETA card */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            {delivered ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
                <p className="font-display text-2xl font-black">¡Entregado!</p>
                <p className="text-sm text-muted-foreground">
                  ¡Que aproveche! Gracias por tu pedido.
                </p>
              </div>
            ) : data.estimatedDeliveryAt ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Entrega estimada
                </p>
                <p className="font-display text-4xl font-black text-primary flex items-center justify-center gap-2">
                  <Clock className="w-7 h-7" />
                  {formatClock(data.estimatedDeliveryAt)}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-eta-remaining">
                  {remainingMin && remainingMin > 0
                    ? `Quedan unos ${remainingMin} min`
                    : "Llega en cualquier momento"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Loader2 className="w-7 h-7 mx-auto animate-spin text-primary" />
                <p className="font-medium">Calculando el tiempo estimado…</p>
                <p className="text-sm text-muted-foreground">
                  Te lo mostraremos en un momento.
                </p>
              </div>
            )}
          </div>

          {/* Progress timeline */}
          <div className="space-y-1" data-testid="tracking-timeline">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={stage.key} className="flex items-stretch gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? "bg-primary/20 text-primary"
                          : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground border border-border"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] ${
                          done ? "bg-primary/40" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-6 pt-1.5 ${active ? "" : "opacity-70"}`}>
                    <p
                      className={`font-bold leading-tight ${
                        active ? "text-primary" : ""
                      }`}
                    >
                      {stage.label}
                    </p>
                    {active && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Estamos en ello…
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">
        Esta página se actualiza sola.
      </p>
    </div>
  );
}
