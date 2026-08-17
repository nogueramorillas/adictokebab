import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLocation } from "wouter";

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [repeating, setRepeating] = useState(false);

  useEffect(() => {
    fetch("/api/my-orders")
      .then((res) => res.json())
      .then(setOrders);
  }, []);

const handleRepeatOrder = (order: any) => {
  setRepeating(true);

  order.items.forEach((item: any) => {
    for (let i = 0; i < item.quantity; i++) {
      addItem({
        name: item.name,
        price: item.price.toString(), // CLAVE
      });
    }
  });

  setTimeout(() => {
    setLocation("/?cart=open");
  }, 1500);
};

if (repeating) {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <p className="text-xl font-bold mb-2">
          Pedido repetido correctamente
        </p>
        <p className="text-sm text-muted-foreground">
          Redirigiendo al menú...
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-[500px] mx-auto space-y-4">

        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Mis pedidos</h1>
          <a href="/" className="text-sm text-muted-foreground">
            ← Volver
          </a>
        </div>

        {orders.length === 0 && (
          <p className="text-center text-muted-foreground">
            No tienes pedidos todavía
          </p>
        )}

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm"
          >
            <div className="flex justify-between">
              <p className="font-bold">{order.customerName}</p>
              <span className="text-xs text-muted-foreground">
                #{order.id}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {order.street}, {order.streetNumber}
            </p>

            <p className="text-sm">
              Estado:{" "}
              <span className="font-medium text-primary">
                {order.status}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
  {new Date(order.createdAt).toLocaleString()}
</p>
            <p className="text-sm font-semibold">
              {order.total.toFixed(2)} €
            </p>
            {order.trackingToken && (
  <a
    href={`/tracking/${order.trackingToken}`}
    className="block w-full text-center bg-primary text-white py-2 rounded-lg text-sm"
  >
    Ver seguimiento
  </a>
)}
          <button
            onClick={() => handleRepeatOrder(order)}
            className="w-full border border-border text-foreground py-2 rounded-lg text-sm"
          >
            Repetir pedido
          </button>
          </div>
        ))}
      </div>
    </div>
  );
}