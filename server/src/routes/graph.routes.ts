import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getRepoGraph } from "../controllers/graph.controller";

const router = Router();

router.get("/repos/:repoId/graph", authMiddleware, getRepoGraph);

export default router;
