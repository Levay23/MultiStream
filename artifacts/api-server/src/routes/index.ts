import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import serversRouter from "./servers";
import packagesRouter from "./packages";
import resellersRouter from "./resellers";
import dashboardRouter from "./dashboard";
import streamingRouter from "./streaming";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(serversRouter);
router.use(packagesRouter);
router.use(resellersRouter);
router.use(dashboardRouter);
router.use(streamingRouter);

export default router;
