import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { CheckCircle2, Loader2, MapPin, Copy, Check, MapPinned } from "lucide-react";
import { useCreateOrder } from "@/api";
import { useCart } from "@/lib/cart";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// ─── Schema (solo para domicilio) ────────────────────────────────────────────

function buildSchema(requireConsent: boolean) {
  return z
    .object({
      customerName: z.string().min(2, { message: "Introduce un nombre válido" }),
      phone: z
        .string()
        .min(9, { message: "Introduce un teléfono válido" })
        .regex(/^[0-9 +]{9,}$/, { message: "Introduce un teléfono válido" }),
      street: z.string().min(3, { message: "Introduce la calle" }),
      streetNumber: z.string().min(1, { message: "Falta el número" }),
      town: z.string().min(2, { message: "Introduce la población" }).default("Mataró"),
      notes: z.string().min(3, { message: "Indica piso, puerta u otras indicaciones" }),
      paymentMethod: z.enum(["card", "cash"]),
      cashAmount: z.string().optional(),
      acceptPrivacy: z.boolean().optional(),
      website: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.paymentMethod === "cash" && (!data.cashAmount || isNaN(parseFloat(data.cashAmount)))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica con cuánto vas a pagar",
          path: ["cashAmount"],
        });
      }
      if (requireConsent && data.acceptPrivacy !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes aceptar la política de privacidad",
          path: ["acceptPrivacy"],
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// ─── Pedido Local: sin formulario, solo pago ─────────────────────────────────

let _localCount = 0;
function nextLocalName() {
  _localCount += 1;
  return `Local #${_localCount}`;
}

function LocalCheckoutForm({ onComplete }: { onComplete: () => void }) {
  const { items, total, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("cash");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // sync counter on mount
  }, []);

  function confirm() {
    if (items.length === 0) return;
    createOrder.mutate(
      {
        data: {
          customerName: nextLocalName(),
          phone: "000000000",
          street: "Local",
          streetNumber: "-",
          town: "Local",
          notes: "Pedido local",
          paymentMethod,
          cashAmount: paymentMethod === "cash" ? total : undefined,
          total,
          items: items.map((i) => ({ name: i.name, price: i.priceNum, quantity: i.quantity })),
          website: "",
          acceptPrivacy: false,
        },
      },
      {
        onSuccess: () => {
          clearCart();
          setDone(true);
        },
      }
    );
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
        <p className="font-display font-black text-2xl uppercase">¡Pedido creado!</p>
        <Button onClick={onComplete} className="font-bold w-full py-6 text-lg">
          Volver a pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Método de pago</p>
        <div className="grid grid-cols-2 gap-3">
          {(["cash", "card"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPaymentMethod(m)}
              className={`p-4 rounded-xl border-2 font-bold text-center transition-colors ${
                paymentMethod === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {m === "cash" ? "Efectivo" : "Tarjeta"}
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={confirm}
        disabled={createOrder.isPending || items.length === 0}
        className="w-full py-6 text-lg font-bold mt-2"
      >
        {createOrder.isPending ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
        ) : (
          `Confirmar (${total.toFixed(2).replace(".", ",")}€)`
        )}
      </Button>
    </div>
  );
}

// ─── Pedido Domicilio ─────────────────────────────────────────────────────────

type CheckoutFormProps = {
  onComplete: () => void;
  successTitle?: string;
  successMessage?: string;
  completeLabel?: string;
  showPrivacyConsent?: boolean;
  showTrackingLink?: boolean;
  isLocal?: boolean;
};

// Enruta a LocalCheckoutForm o DeliveryCheckoutForm según el modo
export default function CheckoutForm(props: CheckoutFormProps) {
  if (props.isLocal) return <LocalCheckoutForm onComplete={props.onComplete} />;
  return <DeliveryCheckoutForm {...props} />;
}

function DeliveryCheckoutForm({
  onComplete,
  successTitle = "¡Pedido recibido!",
  successMessage = "Estamos preparando tu comida. Te llegará muy pronto a casa. ¡Gracias por elegir Adicto Kebab!",
  completeLabel = "Volver al menú",
  showPrivacyConsent = true,
  showTrackingLink = true,
}: CheckoutFormProps) {
  const { items, total, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [success, setSuccess] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const schema = useMemo(() => buildSchema(showPrivacyConsent ?? true), [showPrivacyConsent]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      phone: "",
      street: "",
      streetNumber: "",
      town: "Mataró",
      notes: "",
      paymentMethod: "card",
      cashAmount: "",
      acceptPrivacy: false,
      website: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const MIN_ORDER = 10;

  function onSubmit(values: FormValues) {
    if (items.length === 0) return;
    if (total < MIN_ORDER) return;

    const cashAmount =
      values.paymentMethod === "cash" && values.cashAmount
        ? parseFloat(values.cashAmount.replace(",", "."))
        : undefined;

    if (values.paymentMethod === "cash" && (cashAmount == null || cashAmount < total)) {
      form.setError("cashAmount", {
        message: `El importe debe ser igual o mayor que el total (${total.toFixed(2).replace(".", ",")}€)`,
      });
      return;
    }

    createOrder.mutate({
      data: {
        customerName: values.customerName,
        phone: values.phone,
        street: values.street,
        streetNumber: values.streetNumber,
        town: values.town,
        notes: values.notes,
        paymentMethod: values.paymentMethod,
        cashAmount,
        total: total,
        website: values.website,
        acceptPrivacy: values.acceptPrivacy,
        items: items.map(item => ({
          name: item.name,
          price: item.priceNum,
          quantity: item.quantity
        }))
      }
    }, {
      onSuccess: (order) => {
        setTrackingToken(order.trackingToken ?? null);
        if (order.trackingToken) {
          localStorage.setItem("lastOrderToken", order.trackingToken);
        }
        setSuccess(true);
        clearCart();
      }
    });
  }

  const trackingPath = trackingToken
    ? `${import.meta.env.BASE_URL}seguimiento/${trackingToken}`
    : null;
  const trackingUrl =
    trackingPath && typeof window !== "undefined"
      ? `${window.location.origin}${trackingPath}`
      : null;

  async function copyTrackingUrl() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="w-full max-w-[500px] mx-auto bg-background rounded-xl overflow-hidden p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-primary" />
          <h3 className="font-display text-2xl font-black uppercase">{successTitle}</h3>
          <p className="text-muted-foreground text-balance">{successMessage}</p>

          {showTrackingLink && trackingPath && (
            <div className="w-full mt-2 rounded-2xl border border-border bg-card p-4 text-left space-y-3">
              <p className="font-bold flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-primary" />
                Sigue tu pedido en directo
              </p>
              <p className="text-sm text-muted-foreground">
                Guarda este enlace para ver el estado y el tiempo estimado de entrega.
              </p>
              <Link href={`/seguimiento/${trackingToken}`} className="block" data-testid="link-track-order">
                <Button className="w-full font-bold" size="lg">Seguir mi pedido</Button>
              </Link>
              {trackingUrl && (
                <button
                  type="button"
                  onClick={copyTrackingUrl}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-copy-tracking"
                >
                  <span className="truncate">{trackingUrl}</span>
                  {copied ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                </button>
              )}
            </div>
          )}

          <Button
            onClick={onComplete}
            variant={showTrackingLink && trackingPath ? "outline" : "default"}
            className="mt-4 font-bold w-full"
            size="lg"
            data-testid="button-checkout-complete"
          >
            {completeLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="space-y-4">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Datos de entrega
          </h4>

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} data-testid="input-checkout-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="600 000 000" {...field} data-testid="input-checkout-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de calle" {...field} data-testid="input-checkout-street" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="streetNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 12" {...field} data-testid="input-checkout-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="town"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Población</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-checkout-town" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indicaciones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Piso, puerta, o notas para el repartidor"
                    className="resize-none"
                    {...field}
                    data-testid="input-checkout-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-bold text-lg">Método de pago</h4>

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                    data-testid="radio-checkout-payment"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border border-border bg-card">
                      <FormControl>
                        <RadioGroupItem value="card" />
                      </FormControl>
                      <FormLabel className="font-normal w-full cursor-pointer">
                        Tarjeta al repartidor (TPV)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border border-border bg-card">
                      <FormControl>
                        <RadioGroupItem value="cash" />
                      </FormControl>
                      <FormLabel className="font-normal w-full cursor-pointer">
                        Efectivo
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {paymentMethod === "cash" && (
            <FormField
              control={form.control}
              name="cashAmount"
              render={({ field }) => (
                <FormItem className="bg-primary/5 p-4 rounded-xl border border-primary/20 mt-2">
                  <FormLabel className="text-primary font-bold">¿Con cuánto vas a pagar?</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Para que el repartidor lleve el cambio exacto.</p>
                  <FormControl>
                    <Input type="number" step="0.5" placeholder={`Ej. 20 (Total: ${total}€)`} {...field} data-testid="input-checkout-cash" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Honeypot */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        {showPrivacyConsent && (
          <FormField
            control={form.control}
            name="acceptPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-checkout-privacy"
                  />
                </FormControl>
                <div className="space-y-1 leading-tight">
                  <FormLabel className="font-normal text-sm cursor-pointer">
                    Acepto la{" "}
                    <Link href="/privacidad" target="_blank" className="text-primary underline" data-testid="link-checkout-privacy">
                      política de privacidad
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        {total < MIN_ORDER && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium text-center">
            Pedido mínimo a domicilio: <strong>10,00€</strong><br />
            <span className="text-xs font-normal opacity-80">Te faltan {(MIN_ORDER - total).toFixed(2).replace('.', ',')}€ para llegar al mínimo</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-6 text-lg font-bold"
          disabled={createOrder.isPending || total < MIN_ORDER}
          data-testid="button-checkout-submit"
        >
          {createOrder.isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
          ) : (
            `Confirmar Pedido (${total.toFixed(2).replace('.', ',')}€)`
          )}
        </Button>

        {createOrder.isError && (
          <p className="text-destructive text-sm text-center font-medium mt-2">
            Ha ocurrido un error al crear el pedido. Inténtalo de nuevo.
          </p>
        )}
      </form>
    </Form>
  );
}
