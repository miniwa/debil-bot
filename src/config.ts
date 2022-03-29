import { err, ok, Result } from "./result";

export interface IConfig {
  readonly botToken: string;
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
  return ok({
    botToken: botToken,
  });
}
