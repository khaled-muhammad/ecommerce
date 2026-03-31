import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { logger } from "../config/logger.js";
import { ZodError } from "zod";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode ?? 500;

  if (err instanceof MulterError) {
    res.status(400).json({
      error: "BAD_REQUEST",
      message: err.message,
    });
    return;
  }

  if (err instanceof Error && err.message === "Only image files are allowed") {
    res.status(400).json({ error: "BAD_REQUEST", message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: "Validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (status >= 500) {
    logger.error({ err, status }, "Unhandled error");
  } else {
    logger.warn({ err, status, code: err.code }, "Client error");
  }

  res.status(status).json({
    error: err.code ?? "INTERNAL",
    message: status >= 500 ? "Internal server error" : err.message,
  });
}
