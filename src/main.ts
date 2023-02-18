import {Client} from "discord.js";
import {
  CommandContext,
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
import {buildConfig, IConfig} from "./config";
import {formatErrorMeta, logger} from "./logger";
import {Assert} from "./misc/assert";
import {addBreadcrumb, Breadcrumb} from "@sentry/node";
import {captureWithSerializedException, configureSentry} from "./misc/error";
import {getOrCreateGuildContext} from "./context";
import {destroyIdleGuildContextsTask} from "./tasks";

async function main() {
  const configResult = buildConfig();
  if (configResult.isErr()) {
    logger.error("Failed to build config", formatErrorMeta(configResult.error));
    process.exit(0);
  }
  const config = configResult.value;
  // Init sentry as early as possible.
  configureSentry(config);

  const client = initClient();
  process.on("SIGINT", () => {
    logger.info("SIGINT handler");
    cleanup(client);
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM handler");
    cleanup(client);
  });

  logger.info("Logging in..");
  try {
    await client.login(config.getBotToken());
    initScheduledTasks(config);
  } catch (error) {
    logger.error("Unhandled exception in main", formatErrorMeta(error));
    captureWithSerializedException(error);
  }
}

function initClient(): Client {
  const client = new Client({
    intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
  });

  client.on("error", (error) => {
    logger.error("Unhandled client error", formatErrorMeta(error));
    captureWithSerializedException(error);
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
      const command = parts[0].toLowerCase();

      const guild = message.guild;
      const channel = message.channel;
      Assert.notNullOrUndefined(guild, "guild");
      const logData = {
        guildId: guild.id,
        channelId: channel.id,
        command: command,
        args: parts.slice(1),
      };
      logger.debug("Command detected", logData);
      const commandBreadcrumb: Breadcrumb = {
        category: "main.onCommand",
        message: "Command detected",
        data: logData,
      };
      addBreadcrumb(commandBreadcrumb);

      const guildContext = getOrCreateGuildContext(guild.id);
      guildContext.markCommandReceived();
      const ctx: CommandContext = {
        command: parts[0],
        args: parts.slice(1),
        guildContext: guildContext,
        musicPlayer: guildContext.getMusicPlayer(),
        guild: guild,
        message: message,
      };
      if (command === "join") {
        const response = handleJoin(ctx);
        message.reply(response);
      }

      if (command === "leave") {
        const response = handleLeave(ctx);
        message.reply(response);
      }

      if (command === "np") {
        const response = handleNowPlaying(ctx);
        message.reply(response);
      }

      if (command === "play") {
        const response = await handlePlay(ctx);
        message.reply(response);
      }

      if (command === "stop") {
        const response = handleStop(ctx);
        message.reply(response);
      }

      if (command === "skip") {
        const response = await handleSkip(ctx);
        message.reply(response);
      }

      if (command === "queue") {
        const response = handleQueue(ctx);
        message.reply(response);
      }
      handleCommandProfile.done({level: "debug", message: "Command handler profile"});
    }
  });
  return client;
}

function initScheduledTasks(config: IConfig) {
  destroyIdleGuildContextsTask(config.getMaxIdleTimeSeconds());
}

function cleanup(client: Client) {
  client.destroy();
  process.exit(0);
}

main().catch((error) => {
  logger.error(`Unhandled exception catch in main: ${error.message}`, formatErrorMeta(error));
  captureWithSerializedException(error);
});
