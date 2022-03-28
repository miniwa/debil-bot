import { Client, Intents } from "discord.js";
import * as conf from "../config.json";
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
import { formatErrorMeta, logger } from "./logger";

async function main() {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
  });

  process.on("exit", () => {
    logger.info("Exit handler started");
    client.destroy();
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT handler");
    client.destroy();
  });

  client.on("error", (error) => {
    logger.error("Unhandled client error", formatErrorMeta(error));
  });

  client.once("ready", () => {
    logger.info("Ready");
  });

  client.on("messageCreate", async (message) => {
    logger.debug("messageCreate", { eventMessage: message });
    const content = message.content;
    if (isCommand(content)) {
      const parts = parseCommand(content);
      const command = parts[0];

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
        if (response) {
          message.reply(response);
        }
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

  logger.info("Logging in");
  try {
    await client.login(conf.token);
  } catch (error: any) {
    logger.error("Unhandled exception in main", formatErrorMeta(error));
  }
}

main().catch((error) => {
  logger.error("Unhandled promise catch in main", formatErrorMeta(error));
});
