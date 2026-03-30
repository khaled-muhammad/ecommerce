import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import app from "./app.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  // Force-exit after 10s if connections linger
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { server };
