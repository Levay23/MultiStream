import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

import { onRequest } from "firebase-functions/v2/https";

if (process.env.NODE_ENV !== "production" || process.env.RENDER) {
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

export const api = onRequest({ region: "us-central1", memory: "256MiB" }, app);
