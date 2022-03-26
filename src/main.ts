import { Client, Intents } from "discord.js";
import * as conf from "../config.json";
import { handleJoin, handleLeave, handlePlay, handleStop, isCommand, parseCommand } from "./commands";
import { formatErrorMeta, logger } from "./logger";
import { Assert } from "./misc/assert";

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
        handleJoin(message);
      }

      if (command === "leave") {
        handleLeave(message);
      }

      if (command === "play") {
        await handlePlay(message, parts);
      }

      if (command === "stop") {
        handleStop(message);
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

main();
