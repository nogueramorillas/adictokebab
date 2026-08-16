import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "../db";
import { GetOrderTrackingParams, GetOrderTrackingResponse } from "../zod";

const router: IRouter = Router();

type Stage = "recibido" | "preparando" | "en_camino" | "entregado" | "cancelado";

function toStage(status: string, pickedUpAt: Date | null): Stage {
  if (status === "cancelled") return "cancelado";
  if (status === "delivered" || status === "completed") return "entregado";
  if (pickedUpAt != null) return "en_camino";
  if (status === "preparing" || status === "ready") return "preparando";
  return "recibido";
}

// Public: customer order tracking by unguessable token. Returns ONLY the
// delivery stage + timing — never phone, address, driver or staff data.
router.get("/track/:token", async (req, res): Promise<void> => {
  const params = GetOrderTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.trackingToken, params.data.token));

  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  const stage = toStage(order.status, order.pickedUpAt);
  const finished = stage === "entregado" || stage === "cancelado";
  const estimatedDeliveryAt =
    !finished && order.etaMinutes != null
      ? new Date(order.createdAt.getTime() + order.etaMinutes * 60_000).toISOString()
      : null;

  res.json(
    GetOrderTrackingResponse.parse({
      customerName: order.customerName,
      stage,
      etaMinutes: finished ? null : order.etaMinutes,
      estimatedDeliveryAt,
      createdAt: order.createdAt.toISOString(),
    }),
  );
});

export default router;
