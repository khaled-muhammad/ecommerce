import crypto from "node:crypto";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { env } from "../config/env.js";

// ── JWT helpers ──

export interface JwtPayload {
  sub: string; // user id
  role: string;
  sessionId: string;
  type: "access" | "refresh";
}

const defaultAccessOpts: SignOptions = { expiresIn: "15m" };
const defaultRefreshOpts: SignOptions = { expiresIn: "7d" };

export function signAccessToken(payload: Omit<JwtPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_SECRET, defaultAccessOpts);
}

export function signRefreshToken(payload: Omit<JwtPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_SECRET, defaultRefreshOpts);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

// ── Password hashing ──

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ── Session token (opaque, stored hashed in DB) ──

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashSessionToken(token: string): Promise<string> {
  return crypto.createHash("sha256").update(token).digest("hex");
}
