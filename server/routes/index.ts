import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import trackRouter from "./track";
import driversRouter from "./drivers";
import myOrdersRouter from "./my-orders";
import menuRouter from "./menu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(trackRouter);
router.use(driversRouter);
router.use(myOrdersRouter);
router.use("/", menuRouter);

export default router;
