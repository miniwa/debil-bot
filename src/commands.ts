import { Message, MessageEmbed } from "discord.js";
import { MusicPlayer, MusicPlayerState } from "./audio/musicPlayer";
import { logger } from "./logger";
import { Assert } from "./misc/assert";
import {
  buildErrorNotConnectedToVoiceChannel,
  buildErrorNotInVoiceChannel,
  buildErrorNotPlaying,
  buildJoinResponse,
  buildLeaveResponse,
  buildNowPlayingResponse,
  buildPlayResponse,
  buildQueueResponse,
  buildStopResponse,
} from "./ui/messages";
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
    return buildErrorNotInVoiceChannel();
  }
  const musicPlayer = getOrCreateMusicPlayer(voice.guild.id);
  musicPlayer.ensureSubscriptionExists(voice.channel);
  return buildJoinResponse(voice.channel.name);
}

export function handleLeave(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (!musicPlayer.subscriptionExists()) {
    return buildErrorNotConnectedToVoiceChannel();
  }
  const channelId = musicPlayer.getSubscribedChannelId();
  const channel = guild.channels.cache.get(channelId);
  Assert.notNullOrUndefined(channel, "channel");
  musicPlayer.removeSubscription();
  return buildLeaveResponse(channel.name);
}

export function handleNowPlaying(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  const nowPlaying = musicPlayer.getNowPlaying();
  if (!nowPlaying) {
    return buildErrorNotPlaying();
  }
  return buildNowPlayingResponse(nowPlaying);
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
  const track = await YouTubeTrack.create(youtubeVideoId, message.author);
  if (musicPlayer.getState() === MusicPlayerState.Idle) {
    await musicPlayer.playTrack(track);
    return buildNowPlayingResponse(track);
  }

  musicPlayer.addTrack(track);
  const positionInQueue = musicPlayer.getQueueLength();
  return buildPlayResponse(positionInQueue, track);
}

export function handleStop(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle stop triggered", {
    guildId: guild.id,
    channelId: message.channel.id,
  });
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (musicPlayer.getState() !== MusicPlayerState.Playing) {
    return buildErrorNotPlaying();
  }
  musicPlayer.ensureStop();
  return buildStopResponse();
}

export function handleQueue(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle queue triggered", {
    guildId: guild.id,
    channelId: message.channel.id,
  });
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  const queuedTracks = musicPlayer.getQueuedTracks();
  const nowPlaying = musicPlayer.getNowPlaying();
  return buildQueueResponse(queuedTracks, nowPlaying);
}
