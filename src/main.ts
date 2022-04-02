import { Client, Intents } from "discord.js";
import {
  handleJoin,
  handleLeave,
  handleNowPlaying,
  handlePlay,
  handleQueue,
  handleSkip,
  handleStop,
  isCommand,
  parseCommand,
} from "./commands";
import { buildConfig } from "./config";
import { formatErrorMeta, logger } from "./logger";
import { Assert } from "./misc/assert";
import { captureException, init } from "@sentry/node";

async function main() {
  const configResult = buildConfig();
  if (configResult.isErr()) {
    logger.error("Failed to build config", formatErrorMeta(configResult.error));
    process.exit(0);
  }
  const config = configResult.value;

  // Configure Sentry as early as possible,
  const sentryDsn = config.getSentryDsn();
  if (sentryDsn !== null) {
    init({
      dsn: sentryDsn,
      tracesSampleRate: config.getSentryTraceSampleRate(),
    });
    logger.debug("Sentry initialized.", {
      sentryDesn: sentryDsn,
      traceSampleRate: config.getSentryTraceSampleRate(),
    });
  } else {
    logger.debug("No Sentry DSN detected. Skipping Sentry init.");
  }

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT handler");
    client.destroy();
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM handler");
    client.destroy();
  });

  client.on("error", (error) => {
    logger.error("Unhandled client error", formatErrorMeta(error));
    captureException(error);
    client.destroy();
  });

  client.once("ready", () => {
    logger.info("Connected");
  });

  client.on("messageCreate", async (message) => {
    const content = message.content;
    if (isCommand(content)) {
      const handleCommandProfile = logger.startTimer();
      const parts = parseCommand(content);
      const command = parts[0];

      const guild = message.guild;
      const channel = message.channel;
      Assert.notNullOrUndefined(guild, "guild");
      logger.debug("Command detected", {
        guildId: guild.id,
        channelId: channel.id,
        command: command,
        args: parts.slice(1),
      });

      if (command === "join") {
        const response = handleJoin(message);
        message.reply(response);
      }

      if (command === "leave") {
        const response = handleLeave(message);
        message.reply(response);
      }

      if (command === "np") {
        const response = handleNowPlaying(message);
        message.reply(response);
      }

      if (command === "play") {
        const response = await handlePlay(message, parts);
        message.reply(response);
      }

      if (command === "stop") {
        const response = handleStop(message);
        message.reply(response);
      }

      if (command === "skip") {
        const response = await handleSkip(message);
        message.reply(response);
      }

      if (command === "queue") {
        const response = handleQueue(message);
        message.reply(response);
      }
      handleCommandProfile.done({ level: "debug", message: "Command handler profile" });
    }
  });

  logger.info("Logging in..");
  try {
    await client.login(config.getBotToken());
  } catch (error) {
    logger.error("Unhandled exception in main", formatErrorMeta(error));
    captureException(error);
  }
}

main().catch((error) => {
  logger.error(`Unhandled exception catch in main: ${error.message}`, formatErrorMeta(error));
  captureException(error);
});
