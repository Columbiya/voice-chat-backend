import { Router } from "express";
import { roomsRouter } from "./roomsRouter";

export const rootRouter = Router();

rootRouter.use("/rooms", roomsRouter);
