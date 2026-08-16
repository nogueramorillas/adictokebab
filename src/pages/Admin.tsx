import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, LogOut, CheckCircle2, Clock, MapPin, Phone, ChefHat, Bike,
  Check, Plus, Calendar, Users, Bike as BikeIcon, MessageCircle, Pencil,
  Save, X, BookOpen, BellRing,
} from "lucide-react";
import {
  useAuthMe,
  useAuthLogin,
  useAuthLogout,
  useListOrders,
  getListOrdersQueryKey,
  useGetOrdersStats,
  getGetOrdersStatsQueryKey,
  useUpdateOrder,
  useListDrivers,
  getListDriversQueryKey,
  type Order,
  type Driver,
} from "@/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewOrderView from "@/components/NewOrderView";
import DriverView from "@/components/DriverView";
import DriversManagement from "@/components/DriversManagement";
import { useLocation } from "wouter";
import OrderTracking from "@/components/OrderTracking";

// Suppress unused import warnings for things that might be used conditionally
void useLocation;
void OrderTracking;

function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}

const loginSchema = z.object({
  username: z.string().min(1, "Escribe el usuario"),
  password: z.string().min(1, "Escribe la contraseña"),
});

function LoginScreen() {
  const login = useAuthLogin();
  const queryClient = useQueryClient();
  void queryClient;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login.mutate(
      { data: { username: values.username, password: values.password } },
      {
        onSuccess: () => {
          window.location.href = "/admin";
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-left w-full max-w-sm mb-2">
            <a href="/" className="text-sm text-muted-foreground">
              ← Volver
            </a>
          </div>
          <h1 className="font-display text-4xl font-black tracking-tighter mb-2">
            STAFF LOGIN
          </h1>
          <p className="text-muted-foreground">
            Acceso solo para personal del restaurante
          </p>
        </div>

        <Card className="border-border">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Usuario..."
                          autoComplete="username"
                          {...field}
                          data-testid="input-admin-username"
                          className="bg-card text-lg py-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Contraseña..."
                          autoComplete="current-password"
                          {...field}
                          data-testid="input-admin-password"
                          className="bg-card text-lg py-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {login.isError && (
                  <p className="text-destructive text-sm font-medium text-center">
                    Usuario o contraseña incorrectos
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full py-6 text-lg font-bold"
                  disabled={login.isPending}
                  data-testid="button-admin-login"
                >
                  {login.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-orange-500" },
  preparing: { label: "En Cocina", color: "bg-blue-500" },
  ready: { label: "Listo", color: "bg-green-500" },
  delivered: { label: "Entregado", color: "bg-slate-500" },
  completed: { label: "Finalizado", color: "bg-emerald-600" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
};

function OrderCard({ order, drivers }: { order: Order; drivers: Driver[] }) {
  const queryClient = useQueryClient();
  const updateOrder = useUpdateOrder();
  const [etaInput, setEtaInput] = useState(
    order.etaMinutes != null ? String(order.etaMinutes) : "",
  );
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(order.phone);

  useEffect(() => {
    setEtaInput(order.etaMinutes != null ? String(order.etaMinutes) : "");
  }, [order.etaMinutes]);

  const handleEtaSave = () => {
    const trimmed = etaInput.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (!Number.isInteger(value) || value < 0)) return;
    updateOrder.mutate(
      { id: order.id, data: { etaMinutes: value } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        },
      },
    );
  };

  const handlePhoneSave = async () => {
    const trimmed = phoneInput.trim();
    if (trimmed.length < 6) return;
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: trimmed }),
    });
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    setEditingPhone(false);
  };

  const handleStatusChange = (
    status:
      | "preparing"
      | "ready"
      | "delivered"
      | "completed"
      | "cancelled",
  ) => {
    updateOrder.mutate(
      { id: order.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["/api/orders-stats"] });
        },
      },
    );
  };

  const handleAssign = (value: string) => {
    const assignedDriverId = value === "none" ? null : Number(value);
    updateOrder.mutate(
      { id: order.id, data: { assignedDriverId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        },
      },
    );
  };

  const isFinished =
    order.status === "completed" || order.status === "cancelled";
  const timeAgo = new Date(order.createdAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const waPhone = order.phone.replace(/\D/g, "");

  return (
    <Card className="mb-4 border-border overflow-hidden">
      <div
        className={`h-1.5 w-full ${statusMap[order.status]?.color || "bg-border"}`}
      />
      <CardContent className="p-0">
        <div className="p-4 bg-card border-b border-border flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg leading-none">#{order.id}</span>
              <Badge
                variant="outline"
                className={`${statusMap[order.status]?.color} text-white border-0`}
              >
                {statusMap[order.status]?.label}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {timeAgo}
              </span>
            </div>
            <h3 className="font-display font-bold text-xl">
              {order.customerName}
            </h3>
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

        <div className="p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm bg-background p-3 rounded-lg border border-border">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {order.street}, {order.streetNumber}
                </p>
                <p className="text-muted-foreground">{order.town}</p>
                {order.notes && (
                  <p className="mt-1 text-orange-400 font-medium italic">
                    Nota: {order.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Phone row with edit + call + whatsapp */}
            <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border border-border">
              {editingPhone ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="bg-card h-8 flex-1"
                  />
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handlePhoneSave}>
                    <Save className="w-4 h-4 text-green-400" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditingPhone(false); setPhoneInput(order.phone); }}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-bold text-blue-400 flex-1">{order.phone}</span>
                  <a href={`tel:${order.phone}`} className="p-1 hover:text-primary" title="Llamar">
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/34${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:text-green-400"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <button className="p-1 hover:text-primary" onClick={() => setEditingPhone(true)} title="Editar teléfono">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {!isFinished && (
              <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border border-border">
                <BikeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                  value={
                    order.assignedDriverId
                      ? String(order.assignedDriverId)
                      : "none"
                  }
                  onValueChange={handleAssign}
                >
                  <SelectTrigger
                    className="bg-card h-9"
                    data-testid={`select-driver-${order.id}`}
                  >
                    <SelectValue placeholder="Asignar repartidor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.displayName || d.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isFinished && (
              <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border border-border">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="ETA"
                    value={etaInput}
                    onChange={(e) => setEtaInput(e.target.value)}
                    className="bg-card h-9 w-20"
                    data-testid={`input-eta-${order.id}`}
                  />
                  <span className="text-muted-foreground">min</span>
                  {order.etaSource && (
                    <Badge variant="secondary" className="text-xs">
                      {order.etaSource === "manual" ? "Manual" : "Auto"}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 ml-auto"
                    disabled={
                      updateOrder.isPending ||
                      etaInput.trim() ===
                        (order.etaMinutes != null
                          ? String(order.etaMinutes)
                          : "")
                    }
                    onClick={handleEtaSave}
                    data-testid={`btn-eta-save-${order.id}`}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}

            {order.paymentMethod === "cash" && order.cashAmount && (
              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                <p className="text-sm text-green-500 font-bold">
                  Paga con: {order.cashAmount.toFixed(2).replace(".", ",")}€
                </p>
                <p className="text-xl font-black text-green-400 uppercase">
                  Cambio:{" "}
                  {(order.cashAmount - order.total).toFixed(2).replace(".", ",")}€
                </p>
              </div>
            )}
          </div>

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
                    <span className="text-primary font-bold mr-2">
                      {item.quantity}x
                    </span>{" "}
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {order.status !== "completed" && order.status !== "cancelled" && (
          <div className="p-4 bg-muted/30 border-t border-border flex gap-2 overflow-x-auto">
            {order.status === "pending" && (
              <Button
                onClick={() => handleStatusChange("preparing")}
                className="flex-1 min-w-[110px]"
                data-testid={`btn-status-prep-${order.id}`}
              >
                <ChefHat className="w-4 h-4 mr-2" /> A Cocina
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                onClick={() => handleStatusChange("ready")}
                className="flex-1 min-w-[110px] bg-blue-600 hover:bg-blue-700"
                data-testid={`btn-status-ready-${order.id}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Listo
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                onClick={() => handleStatusChange("delivered")}
                className="flex-1 min-w-[110px] bg-slate-600 hover:bg-slate-700"
                data-testid={`btn-status-del-${order.id}`}
              >
                <Bike className="w-4 h-4 mr-2" /> Entregado
              </Button>
            )}
            <Button
              onClick={() => handleStatusChange("completed")}
              className="flex-1 min-w-[130px] bg-emerald-600 hover:bg-emerald-700"
              data-testid={`btn-status-complete-${order.id}`}
            >
              <Check className="w-4 h-4 mr-2" /> Finalizar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange("cancelled")}
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              data-testid={`btn-status-cancel-${order.id}`}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Menu editor types -----
type MenuItem = {
  name: string;
  price: string;
  desc?: string;
  meatOptions?: string[];
  menuPrice?: string;
  active?: boolean;
};
type MenuData = Record<string, MenuItem[]>;

const CATEGORY_LABELS: Record<string, string> = {
  destacados: "Destacados",
  durum: "Durum",
  patatas: "Patatas",
  fingers: "Fingers de Pollo",
  combinado: "Combinado",
  postres: "Postres",
  menus: "Menús",
  bebidas: "Bebidas",
  salsas: "Salsas",
};

function MenuTab() {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/menu", { credentials: "include" })
      .then((r) => r.json())
      .then((data: MenuData) => setMenu(data))
      .catch(() => setMenu(null))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (cat: string, idx: number, field: keyof MenuItem, value: string | boolean) => {
    setMenu((prev) => {
      if (!prev) return prev;
      const items = [...prev[cat]];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, [cat]: items };
    });
  };

  const removeItem = (cat: string, idx: number) => {
    setMenu((prev) => {
      if (!prev) return prev;
      const items = prev[cat].filter((_, i) => i !== idx);
      return { ...prev, [cat]: items };
    });
  };

  const addItem = (cat: string) => {
    setMenu((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [cat]: [...prev[cat], { name: "Nuevo producto", price: "0,00€", desc: "" }],
      };
    });
  };

  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const r = await fetch("/api/menu", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      if (r.ok) {
        setSaveMsg("Carta guardada correctamente");
      } else {
        const err = await r.json() as { error?: string };
        setSaveMsg(err.error ?? "Error al guardar");
      }
    } catch {
      setSaveMsg("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No se pudo cargar la carta.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-black">Carta del Restaurante</h2>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-sm text-muted-foreground">{saveMsg}</span>}
          <Button onClick={handleSave} disabled={saving} className="font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar carta
          </Button>
        </div>
      </div>

      {Object.keys(menu).map((cat) => (
        <Card key={cat} className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg font-bold uppercase">
              {CATEGORY_LABELS[cat] ?? cat}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {menu[cat].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  item.active === false
                    ? "border-border/30 opacity-50"
                    : "border-border"
                } bg-background`}
              >
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(cat, idx, "name", e.target.value)}
                  className="bg-card flex-1 h-8 text-sm"
                  placeholder="Nombre"
                />
                <Input
                  value={item.price}
                  onChange={(e) => updateItem(cat, idx, "price", e.target.value)}
                  className="bg-card w-24 h-8 text-sm"
                  placeholder="Precio"
                />
                <Button
                  size="sm"
                  variant={item.active === false ? "outline" : "secondary"}
                  className={`h-8 text-xs shrink-0 ${item.active === false ? "text-muted-foreground" : "text-green-400"}`}
                  onClick={() => updateItem(cat, idx, "active", item.active !== false ? false : true)}
                  title={item.active === false ? "Activar" : "Desactivar"}
                >
                  {item.active === false ? "Inactivo" : "Activo"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(cat, idx)}
                  title="Eliminar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => addItem(cat)}
              className="w-full mt-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Añadir producto
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const logout = useAuthLogout();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [statsDate, setStatsDate] = useState<string | null>(null);

  const backToOrders = () => {
    setShowNewOrder(false);
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["/api/orders-stats"] });
  };

  const statsParams = statsDate ? { date: statsDate } : undefined;
  const { data: stats } = useGetOrdersStats(statsParams, {
    query: {
      refetchInterval: 15000,
      queryKey: getGetOrdersStatsQueryKey(statsParams),
    },
  });
  const { data: todayStats } = useGetOrdersStats(undefined, {
    query: {
      refetchInterval: 60000,
      queryKey: getGetOrdersStatsQueryKey(),
    },
  });
  const serverToday = todayStats?.date;
  const isToday = statsDate === null || statsDate === serverToday;

  // topProducts is injected by the backend but not in the generated type
  const topProducts = (stats as (typeof stats & { topProducts?: { name: string; count: number; revenue: number }[] }) | undefined)?.topProducts ?? [];

  const orderQueryParams: { status?: "pending" | "preparing" | "ready" | "delivered" | "completed" | "cancelled"; date?: string } = {};
  if (statusFilter !== "all") orderQueryParams.status = statusFilter as "pending" | "preparing" | "ready" | "delivered" | "completed" | "cancelled";
  if (statsDate) orderQueryParams.date = statsDate;

  const { data: orders = [], isLoading } = useListOrders(orderQueryParams as Parameters<typeof useListOrders>[0], {
    query: {
      refetchInterval: 15000,
      queryKey: getListOrdersQueryKey(orderQueryParams as Parameters<typeof getListOrdersQueryKey>[0]),
    },
  });

  const { data: drivers = [] } = useListDrivers({
    query: { queryKey: getListDriversQueryKey() },
  });

  // ── Notificación cuando un repartidor marca "Entregado" ──────────────────
  const [deliveredAlert, setDeliveredAlert] = useState<{ id: number; name: string } | null>(null);
  const seenDelivered = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Carga inicial: marcar todos los ya entregados como ya vistos
    const allOrders = orders;
    allOrders.forEach((o) => {
      if (o.status === "delivered") seenDelivered.current.add(o.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo en el primer render

  useEffect(() => {
    orders.forEach((o) => {
      if (o.status === "delivered" && !seenDelivered.current.has(o.id)) {
        seenDelivered.current.add(o.id);
        setDeliveredAlert({ id: o.id, name: o.customerName });
        // Sonido de notificación
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.6);
        } catch { /* AudioContext puede no estar disponible */ }
      }
    });
  }, [orders]);
  // ────────────────────────────────────────────────────────────────────────

  // Recent unique customers from all (unfiltered) orders
  const { data: allOrders = [] } = useListOrders(undefined, {
    query: { refetchInterval: 60000, queryKey: [...getListOrdersQueryKey(), "all-customers"] },
  });
  const recentCustomers = (() => {
    const seen = new Set<string>();
    const result: { name: string; phone: string }[] = [];
    for (const o of allOrders) {
      if (!seen.has(o.phone)) {
        seen.add(o.phone);
        result.push({ name: o.customerName, phone: o.phone });
        if (result.length >= 20) break;
      }
    }
    return result;
  })();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  if (showNewOrder) {
    return <NewOrderView onBack={backToOrders} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <h1 className="font-display font-black text-xl tracking-tight">
            ADICTO<span className="text-primary">KEBAB</span>{" "}
            <span className="text-muted-foreground font-medium text-sm ml-2 hidden sm:inline-block">
              Admin Panel
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </header>

      {deliveredAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm animate-in slide-in-from-top-2">
          <div className="mx-4 bg-emerald-600 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 border border-emerald-400">
            <BellRing className="w-6 h-6 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-base">¡Pedido entregado!</p>
              <p className="text-sm text-emerald-100 truncate">
                #{deliveredAlert.id} — {deliveredAlert.name}
              </p>
              <p className="text-xs text-emerald-200 mt-0.5">Pulsa Finalizar para cerrar el pedido</p>
            </div>
            <button onClick={() => setDeliveredAlert(null)} className="shrink-0 text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto p-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border h-auto p-1 flex-wrap mb-6">
            <TabsTrigger value="pedidos" className="px-4 py-2">
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="px-4 py-2">
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="carta" className="px-4 py-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Carta
            </TabsTrigger>
            <TabsTrigger value="equipo" className="px-4 py-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Equipo
            </TabsTrigger>
          </TabsList>

          {/* ---- PEDIDOS ---- */}
          <TabsContent value="pedidos" className="m-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-black">
                    {isToday ? "Pedidos de hoy" : "Pedidos del día"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="date"
                    value={statsDate ?? serverToday ?? ""}
                    max={serverToday}
                    onChange={(e) => setStatsDate(e.target.value || null)}
                    className="bg-card w-auto"
                    data-testid="input-stats-date"
                  />
                  {!isToday && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatsDate(null)}
                      data-testid="button-stats-today"
                    >
                      Hoy
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setShowNewOrder(true)}
                    className="font-bold"
                    data-testid="button-new-order"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Nuevo Pedido
                  </Button>
                </div>
              </div>

              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="bg-card border border-border h-auto p-1 flex-wrap mb-4">
                  <TabsTrigger value="all" className="px-4 py-2">Todos</TabsTrigger>
                  <TabsTrigger value="pending" className="px-4 py-2">Pendientes</TabsTrigger>
                  <TabsTrigger value="preparing" className="px-4 py-2">En curso</TabsTrigger>
                  <TabsTrigger value="delivered" className="px-4 py-2">Entregados</TabsTrigger>
                  <TabsTrigger value="completed" className="px-4 py-2">Finalizados</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="m-0 border-0 p-0">
                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-card border border-border border-dashed rounded-xl py-16 text-center text-muted-foreground">
                      <p className="font-medium">No hay pedidos todavía</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <OrderCard key={order.id} order={order} drivers={drivers} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* ---- ESTADÍSTICAS ---- */}
          <TabsContent value="estadisticas" className="m-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-black">
                    {isToday ? "Resumen de hoy" : "Resumen del día"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={statsDate ?? serverToday ?? ""}
                    max={serverToday}
                    onChange={(e) => setStatsDate(e.target.value || null)}
                    className="bg-card w-auto"
                  />
                  {!isToday && (
                    <Button variant="outline" size="sm" onClick={() => setStatsDate(null)}>
                      Hoy
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pendientes <span className="text-xs">(ahora)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-black text-orange-500">
                      {stats?.pendingCount || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      En Curso <span className="text-xs">(ahora)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-black text-blue-500">
                      {stats?.activeCount || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {isToday ? "Pedidos Hoy" : "Pedidos del día"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div
                      className="text-3xl font-black text-foreground"
                      data-testid="stat-day-count"
                    >
                      {stats?.todayCount || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {isToday ? "Ingresos Hoy" : "Ingresos del día"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div
                      className="text-3xl font-black text-green-500"
                      data-testid="stat-day-revenue"
                    >
                      {(stats?.todayRevenue || 0).toFixed(2).replace(".", ",")}€
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top products */}
              {topProducts.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-black mb-3 uppercase tracking-tight">
                    Top productos del día
                  </h3>
                  <Card className="border-border">
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-card">
                            <th className="text-left p-3 font-bold text-muted-foreground">Producto</th>
                            <th className="text-right p-3 font-bold text-muted-foreground">Uds.</th>
                            <th className="text-right p-3 font-bold text-muted-foreground">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map((p, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0">
                              <td className="p-3 font-medium">{p.name}</td>
                              <td className="p-3 text-right text-primary font-bold">{p.count}</td>
                              <td className="p-3 text-right text-green-500 font-bold">
                                {p.revenue.toFixed(2).replace(".", ",")}€
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent customers */}
              {recentCustomers.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-black mb-3 uppercase tracking-tight">
                    Clientes recientes
                  </h3>
                  <div className="space-y-2">
                    {recentCustomers.map((c, i) => {
                      const phone = c.phone.replace(/\D/g, "");
                      const offerText = encodeURIComponent(
                        `Hola ${c.name}, tenemos una oferta especial para ti en Adicto Kebab 🌯`,
                      );
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-card border border-border p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-bold text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          </div>
                          <a
                            href={`https://wa.me/34${phone}?text=${offerText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="text-green-400 border-green-500/30 hover:bg-green-500/10 text-xs">
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Enviar oferta
                            </Button>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- CARTA ---- */}
          <TabsContent value="carta" className="m-0">
            <MenuTab />
          </TabsContent>

          {/* ---- EQUIPO ---- */}
          <TabsContent value="equipo" className="m-0">
            <DriversManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Admin() {
  useDarkMode();
  const { data: auth, isLoading } = useAuthMe();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth || !auth?.authenticated) {
    return <LoginScreen />;
  }

  if (auth?.role === "driver") {
    return <DriverView displayName={auth?.displayName} />;
  }

  if (auth?.role === "customer") {
    window.location.href = "/";
    return null;
  }

  return (
    <div>
      <div className="p-2 flex justify-between">
        <a href="/" className="text-sm text-muted-foreground">
          ← Volver
        </a>
      </div>
      <Dashboard />
    </div>
  );
}
