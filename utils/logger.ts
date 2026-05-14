import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "neolift-erp-pwa",
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  },
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "headers.authorization",
      "cookies.neo_access_token",
      "cookies.neo_session",
    ],
    remove: true,
  },
});

export type LogContext = {
  requestId?: string;
  userId?: string;
  workOrderId?: string;
  endpoint?: string;
  operationType?: string;
  sync?: Record<string, unknown>;
  upload?: Record<string, unknown>;
};
