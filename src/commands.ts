import { Message, MessageOptions } from "discord.js";
import { MusicPlayer, MusicPlayerState } from "./audio/musicPlayer";
import { logger } from "./logger";
import { Assert } from "./misc/assert";
import {
  buildErrorNoSearchResult,
  buildErrorNotConnectedToVoiceChannel,
  buildErrorNotInVoiceChannel,
  buildErrorNotPlaying,
  buildJoinResponse,
  buildLeaveResponse,
  buildNowPlayingResponse,
  buildPlayResponse as buildQueuedResponse,
  buildQueueResponse,
  buildSkipResponse,
  buildStopResponse,
  buildTrackContentError,
  buildUiMessageResponse,
  buildYouTubeNotAvailable,
} from "./ui/messages";
import { YouTubeProvider } from "./youtube/provider";
import { YouTubeTrack } from "./youtube/track";
import { parseYouTubeVideoId, YouTubeVideoId } from "./youtube/url";

const youTubeProvider = new YouTubeProvider();
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
  musicPlayer.subscribeChannel(voice.channel);
  return buildJoinResponse(voice.channel.name);
}

export function handleLeave(message: Message) {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (!musicPlayer.hasSubscribedChannel()) {
    return buildErrorNotConnectedToVoiceChannel();
  }
  const channelId = musicPlayer.getSubscribedChannelId();
  const channel = guild.channels.cache.get(channelId);
  Assert.notNullOrUndefined(channel, "channel");
  musicPlayer.unsubscribeChannel();
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

export async function handlePlay(message: Message, commandParts: string[]): Promise<MessageOptions> {
  const requester = message.author;
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle play triggered", {
    commandParts: commandParts,
    guildId: guild.id,
    channelId: message.channel.id,
  });

  if (commandParts.length === 1) {
    return {
      content: "Usage !play <youtube url> OR !play <search query>",
    };
  }

  let track: YouTubeTrack | null = null;
  if (commandParts.length === 2) {
    const possibleYouTubeUrl = commandParts[1];
    if (possibleYouTubeUrl.startsWith("http")) {
      // Parse as URL
      const parseIdResult = parseYouTubeVideoId(possibleYouTubeUrl);
      if (parseIdResult.isErr()) {
        return buildUiMessageResponse(parseIdResult.error);
      }

      const byIdResult = await youTubeProvider.byVideoId(parseIdResult.value, requester);
      if (byIdResult.isErr()) {
        return buildYouTubeNotAvailable();
      }
      track = byIdResult.value;
    }
  }

  // Track null means param was not a single youtube url.
  // I.e we need to perform a search instead.
  if (track === null) {
    const queryParams = commandParts.slice(1);
    const query = queryParams.join(" ");
    const searchResult = await youTubeProvider.search(query, requester);
    if (searchResult.isErr()) {
      const error = searchResult.error;
      if (error.kind === "YTNoResult") {
        return buildErrorNoSearchResult(query);
      }
      return buildYouTubeNotAvailable();
    }
    track = searchResult.value;
  }

  const requesterVoiceChannel = message.member?.voice?.channel ?? null;
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  if (!musicPlayer.hasSubscribedChannel()) {
    if (!requesterVoiceChannel) {
      return buildErrorNotInVoiceChannel();
    }
    musicPlayer.subscribeChannel(requesterVoiceChannel);
  }

  // Change channel is requester is connected to a different voice channel.
  if (musicPlayer.hasSubscribedChannel()) {
    if (requesterVoiceChannel && musicPlayer.getSubscribedChannelId() !== requesterVoiceChannel.id) {
      musicPlayer.subscribeChannel(requesterVoiceChannel);
    }
  }

  const playOrAddResult = await musicPlayer.playOrAddToQueue(track);
  if (playOrAddResult.isErr()) {
    return buildTrackContentError();
  }
  const positionInQueue = playOrAddResult.value;
  if (positionInQueue === 0) {
    return buildNowPlayingResponse(track);
  }
  return buildQueuedResponse(positionInQueue, track);
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
  musicPlayer.stop();
  return buildStopResponse();
}

export async function handleSkip(message: Message): Promise<MessageOptions> {
  const guild = message.guild;
  Assert.notNullOrUndefined(guild, "guild");
  logger.info("Handle skip triggered", {
    guildId: guild.id,
    channelId: message.channel.id,
  });
  const musicPlayer = getOrCreateMusicPlayer(guild.id);
  const nowPlaying = musicPlayer.getNowPlaying();
  if (!nowPlaying) {
    return buildErrorNotPlaying();
  }
  const playResult = await musicPlayer.playNextOrStop();
  if (playResult.isErr()) {
    return buildTrackContentError();
  }
  return buildSkipResponse(nowPlaying);
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
