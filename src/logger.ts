import winston from "winston";

export const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "logger.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

export function formatErrorMeta(error: Error) {
  return {
    error: error,
    errorMessage: error.message,
    stack: error.stack,
    name: error.name,
  };
}
