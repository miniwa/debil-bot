import { Client, Intents } from "discord.js";
import { cli } from "winston/lib/winston/config";
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

async function main() {
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
    client.destroy();
  });

  client.once("ready", () => {
    logger.info("Connected");
  });

  client.on("messageCreate", async (message) => {
    const content = message.content;
    if (isCommand(content)) {
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
    }
  });

  const configResult = buildConfig();
  if (configResult.isErr()) {
    const error = configResult.error;
    logger.error(`ConfigError: ${error}`);
    return;
  }
  const config = configResult.value;

  logger.info("Logging in..");
  try {
    await client.login(config.botToken);
  } catch (error) {
    logger.error("Unhandled exception in main", formatErrorMeta(error));
  }
}

main().catch((error) => {
  logger.error(`Unhandled exception catch in main: ${error.message}`, formatErrorMeta(error));
});
