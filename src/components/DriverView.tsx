import { useQueryClient } from "@tanstack/react-query";
import {
  useListMyOrders,
  getListMyOrdersQueryKey,
  useUpdateMyOrder,
  useAuthLogout,
  type Order,
} from "@/api";
import { Loader2, LogOut, MapPin, Phone, Navigation, Package, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderTracking from "./OrderTracking";

function mapsUrl(order: Order): string {
  const query = `${order.street} ${order.streetNumber}, ${order.town}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function DriverOrderCard({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const updateMyOrder = useUpdateMyOrder();

  const act = (action: "picked_up" | "delivered" | "delay") => {
    updateMyOrder.mutate(
      { id: order.id, data: { action } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
        },
      },
    );
  };

  const timeAgo = new Date(order.createdAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const pickedUp = order.pickedUpAt != null;

  return (
    <Card className="mb-4 border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 bg-card border-b border-border flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg leading-none">#{order.id}</span>
              {pickedUp && (
                <Badge className="bg-amber-500 text-white border-0">Recogido</Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {timeAgo}
              </span>
            </div>
            <h3 className="font-display font-bold text-xl">{order.customerName}</h3>
          </div>
          <div className="text-right">
            <div className="font-black text-2xl text-primary">
              {order.total.toFixed(2).replace(".", ",")}€
            </div>
            <Badge variant="secondary" className="mt-1">
              {order.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">

  <OrderTracking status={order.status} />

  <div className="flex items-start gap-2 text-sm bg-background p-3 rounded-lg border border-border">
    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    <div>
      <p className="font-bold">
        {order.street}, {order.streetNumber}
      </p>
      <p className="text-muted-foreground">{order.town}</p>
      {order.notes && (
        <p className="mt-1 text-orange-400 font-medium italic">Nota: {order.notes}</p>
      )}
    </div>
  </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={mapsUrl(order)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-maps-${order.id}`}
            >
              <Button variant="outline" className="w-full font-bold">
                <Navigation className="w-4 h-4 mr-2" /> Cómo llegar
              </Button>
            </a>
            <a href={`tel:${order.phone}`} data-testid={`link-call-${order.id}`}>
              <Button variant="outline" className="w-full font-bold text-blue-400">
                <Phone className="w-4 h-4 mr-2" /> Llamar
              </Button>
            </a>
          </div>

          {order.paymentMethod === "cash" && order.cashAmount && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <p className="text-sm text-green-500 font-bold">
                Paga con: {order.cashAmount.toFixed(2).replace(".", ",")}€
              </p>
              <p className="text-xl font-black text-green-400 uppercase">
                Cambio: {(order.cashAmount - order.total).toFixed(2).replace(".", ",")}€
              </p>
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
              Comanda
            </h4>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm items-center bg-background p-2 rounded border border-border/50"
                >
                  <span className="font-medium">
                    <span className="text-primary font-bold mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex gap-2">
          {!pickedUp && (
            <Button
              onClick={() => act("picked_up")}
              disabled={updateMyOrder.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              data-testid={`btn-pickup-${order.id}`}
            >
              <Package className="w-4 h-4 mr-2" /> Recogido
            </Button>
          )}
          <Button
            onClick={() => act("delivered")}
            disabled={updateMyOrder.isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            data-testid={`btn-deliver-${order.id}`}
          >
            <Check className="w-4 h-4 mr-2" /> Entregado
          </Button>
        </div>
        <div className="px-4 pb-4 bg-muted/30">
          <Button
            variant="outline"
            onClick={() => act("delay")}
            disabled={updateMyOrder.isPending}
            className="w-full border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
            data-testid={`btn-delay-${order.id}`}
          >
            <Clock className="w-4 h-4 mr-2" /> Retraso leve (+10 min)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverView({ displayName }: { displayName?: string | null }) {
  const queryClient = useQueryClient();
  const logout = useAuthLogout();
  const { data: orders = [], isLoading } = useListMyOrders({
    query: { refetchInterval: 15000, queryKey: getListMyOrdersQueryKey() },
  });

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display font-black text-lg tracking-tight">
              ADICTO<span className="text-primary">KEBAB</span>
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">
              {displayName ?? "Repartidor"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground"
            data-testid="button-driver-logout"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-6">
        <h2 className="font-display text-2xl font-black mb-4">Mis entregas</h2>
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl py-16 text-center text-muted-foreground">
            <p className="font-medium">No tienes entregas asignadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <DriverOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
