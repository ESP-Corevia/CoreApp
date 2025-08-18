import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const transport = !isProd
  ? { target: "pino-pretty", options: { colorize: true, levelFirst: true } }
  : undefined;

export const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  transport as any
);

export default logger;
