import { Client, Intents } from "discord.js";
import * as conf from "../config.json";
import { isCommand, parseCommand } from "./commands";

const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", () => {
  console.log("Ready");

});

client.on("messageCreate", (message) => {
    console.log(`Content = ${message.content}`);
    const content = message.content;
    if(isCommand(content)) {
      const parts = parseCommand(content);
      const command = parts[0];

      if(command ===  "join") {
        const voice = message.member?.voice;
        if(!voice) {
          message.reply("User is not in a channel");
          return;
        }

        const voiceChannel = voice.channel;
        client.channels.cache.get("a")
        message.member?.voice.
      }
    }
  });

client.login(conf.token);
