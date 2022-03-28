export interface IConfig {
  readonly botToken: string;
}

export class ConfigException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigException";
  }
}

export function buildConfig(): IConfig {
  const botToken = process.env.DEBIL_BOT_TOKEN;
  if (!botToken) {
    throw new ConfigException("Missing DEBIL_BOT_TOKEN from environment");
  }
  return {
    botToken: botToken,
  };
}
