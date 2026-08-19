import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import itemsRouter from "./items.js";
import valuationRouter from "./valuation.js";
import watchlistRouter from "./watchlist.js";
import statsRouter from "./stats.js";
import adminRouter from "./admin.js";
import collectionRouter from "./collection.js";
import anthropicRouter from "./anthropic/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(itemsRouter);
router.use(valuationRouter);
router.use(watchlistRouter);
router.use(statsRouter);
router.use(collectionRouter);
router.use(adminRouter);
router.use(anthropicRouter);

export default router;
