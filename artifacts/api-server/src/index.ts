import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || 10000);

import { onRequest } from "firebase-functions/v2/https";

if (process.env.NODE_ENV !== "production" || process.env.RENDER) {
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

export const api = onRequest({ region: "us-central1", memory: "256MiB" }, app);
