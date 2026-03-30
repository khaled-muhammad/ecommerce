import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/ready", (_req, res) => {
  // In production, check DB + Redis connectivity here
  res.json({ status: "ready" });
});

export default router;
