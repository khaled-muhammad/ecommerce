import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/v1/health.js";
import authRouter from "./routes/v1/auth.js";
import catalogRouter from "./routes/v1/catalog.js";
import cartRouter from "./routes/v1/cart.js";
import checkoutRouter, { handleStripeWebhook } from "./routes/v1/checkout.js";
import staffRouter from "./routes/v1/staff.js";
import promosRouter from "./routes/v1/promotions.js";
import analyticsRouter from "./routes/v1/analytics.js";
import profileRouter from "./routes/v1/profile.js";
import adminCatalogRouter from "./routes/v1/adminCatalog.js";

const app = express();

// Trust proxy for correct IP in rate limiting behind CDN/proxy
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS — explicit origin allowlist
const allowedOrigins = env.CORS_ORIGINS.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-origin requests (mobile, server-to-server) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Idempotency-Key"],
  }),
);

// Gzip
app.use(compression());

// Request logging
app.use(pinoHttp({ logger }));

// Request ID
app.use(requestId);

// Stripe webhook must see raw body for signature verification
app.post(
  "/api/v1/checkout/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// JSON body — limit to prevent abuse
app.use(express.json({ limit: "512kb" }));

// Cookie parsing for refresh tokens
app.use(cookieParser());

// v1 API routes
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1", catalogRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/admin/catalog", adminCatalogRouter);
app.use("/api/v1/promotions", promosRouter);
app.use("/api/v1/analytics", analyticsRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Resource not found" });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
