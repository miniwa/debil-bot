import winston from "winston";

export const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "logger.log" }),
    new winston.transports.Console(),
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
