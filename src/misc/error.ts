import { captureException, init } from "@sentry/node";
import { IConfig } from "../config";
import { logger } from "../logger";

export function configureSentry(config: IConfig) {
  // Configure Sentry as early as possible,
  const sentryDsn = config.getSentryDsn();
  if (sentryDsn !== null) {
    init({
      dsn: sentryDsn,
      tracesSampleRate: config.getSentryTraceSampleRate(),
      environment: config.getSentryEnvironment(),
    });
    logger.debug("Sentry initialized.", {
      sentryDsn: sentryDsn,
      traceSampleRate: config.getSentryTraceSampleRate(),
      environment: config.getSentryEnvironment(),
    });
  } else {
    logger.debug("No Sentry DSN detected. Skipping Sentry init.");
  }
}

export function captureWithSerializedException(exception: unknown): string {
  return captureException(exception, {
    extra: {
      serializedException: exception,
    },
  });
}
