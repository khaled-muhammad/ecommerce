import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

/** Backend package root (contains `.env`), stable regardless of `process.cwd()`. */
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : "http://localhost:5173"),
    z.string().url(),
  ),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_REDIRECT_URI: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  REDIS_URL: z.string().optional().default(""),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY: z.string().optional().default(""),
  S3_SECRET_KEY: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("us-east-1"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  if (process.env.NODE_ENV !== "production") {
    // Load `backend/.env` explicitly - cwd may be repo root when using tsx/node from elsewhere
    const fromPackage = path.join(backendRoot, ".env");
    dotenv.config({ path: fromPackage });
    if (!process.env.DATABASE_URL) {
      dotenv.config({ path: path.join(process.cwd(), ".env") });
    }
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${missing}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
