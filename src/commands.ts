import { Message } from "discord.js";
import { MusicPlayer, MusicPlayerState } from "./audio/musicPlayer";
import { logger } from "./logger";
import { Assert } from "./misc/assert";
import { YouTubeTrack } from "./youtube/track";
import { parseYouTubeVideoId, VideoIdException, YouTubeVideoId } from "./youtube/url";

const musicPlayers = new Map<string, MusicPlayer>();
function getOrCreateMusicPlayer(guildId: string): MusicPlayer {
  if (!musicPlayers.has(guildId)) {
    musicPlayers.set(guildId, new MusicPlayer());
    logger.debug("Created MusicPlayer", {
      guildId: guildId,
    });
  }
  const musicPlayer = musicPlayers.get(guildId);
  Assert.notNullOrUndefined(musicPlayer, "musicPlayer");
  return musicPlayer;
}

export function isCommand(message: string) {
  return message.startsWith("!");
}

export function parseCommand(message: string) {
  const parts = message.split(" ");
  // Remove leading "!"
  parts[0] = parts[0].slice(1);
  return parts;
}

export function handleJoin(message: Message) {
  const member = message.member;
  Assert.notNullOrUndefined(member, "member");

  const voice = member.voice;
  if (!voice.channel) {
    message.reply("You are not inside a voice channel");
    return;
  }
  const musicPlayer = getOrCreateMusicPlayer(voice.guild.id);
  musicPlayer.ensureSubscriptionExists(voice.channel);
}

export function handleLeave(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (!musicPlayer.subscriptionExists()) {
    message.reply("Bot is not connected to a voice channel");
    return;
  }
  musicPlayer.removeSubscription();
}

export async function handlePlay(message: Message, commandParts: string[]) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle play triggered", {
    commandParts: commandParts,
    guildId: guild.id,
    channelId: message.channel.id,
  });

  if (commandParts.length !== 2) {
    message.reply("Usage !play <youtube url>");
    return;
  }
  const rawYouTubeVideoUrl = commandParts[1];
  let youtubeVideoId: YouTubeVideoId;
  try {
    youtubeVideoId = parseYouTubeVideoId(rawYouTubeVideoUrl);
  } catch (error) {
    if (error instanceof VideoIdException) {
      message.reply(error.uiMessage);
      return;
    } else {
      throw error;
    }
  }

  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (!musicPlayer.subscriptionExists() || musicPlayer.getSubscribedChannelId() !== message.channelId) {
    const member = message.member;
    Assert.notNullOrUndefined(member, "member");
    const voice = member.voice;
    if (!voice.channel) {
      message.reply("You are not inside a voice channel");
      return;
    }
    musicPlayer.ensureSubscriptionExists(voice.channel);
  }

  const track = await YouTubeTrack.create(youtubeVideoId);
  musicPlayer.addTrack(track);
  if (musicPlayer.getState() === MusicPlayerState.Idle) {
    await musicPlayer.playNext();
  }
}

export function handleStop(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle stop triggered", {
    guildId: guild.id,
    channelId: message.channel.id,
  });
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  musicPlayer.stop();
}
