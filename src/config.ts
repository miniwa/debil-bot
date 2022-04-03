import { err, ok, Result } from "./result";

export interface IConfig {
  getBotToken(): string;
  getSentryDsn(): string | null;
  getSentryEnvironment(): string;
  getSentryTraceSampleRate(): number;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigException";
  }
}

export function buildConfig(): Result<IConfig, ConfigError> {
  const botToken = process.env.DEBIL_BOT_TOKEN;
  if (!botToken) {
    return err(new ConfigError("Missing DEBIL_BOT_TOKEN from environment"));
  }

  const sentryDsn = process.env.DEBIL_SENTRY_DSN ?? null;
  const sentryTraceSampleRate = parseFloat(process.env.DEBIL_SENTRY_TRACE_SAMPLE_RATE ?? "1.0");
  if (isNaN(sentryTraceSampleRate) || sentryTraceSampleRate < 0 || sentryTraceSampleRate > 1) {
    return err(
      new ConfigError(
        `Expected DEBIL_SENTRY_TRACE_SAMPLE_RATE to be a valid number between 0 and 1. Was: ${sentryTraceSampleRate}`
      )
    );
  }

  const sentryEnvironment = process.env.DEBIL_SENTRY_ENVIRONMENT ?? "dev";
  const config: IConfig = {
    getBotToken() {
      return botToken;
    },
    getSentryDsn() {
      return sentryDsn;
    },
    getSentryEnvironment() {
      return sentryEnvironment;
    },
    getSentryTraceSampleRate() {
      return sentryTraceSampleRate;
    },
  };
  return ok(config);
}
