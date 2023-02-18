import { Guild, Message, BaseMessageOptions } from "discord.js";
import { MusicPlayer, MusicPlayerState } from "./audio/musicPlayer";
import { GuildContext } from "./context";
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
import { parseYouTubeVideoId } from "./youtube/url";

const youTubeProvider = new YouTubeProvider();

export interface CommandContext {
  readonly command: string;
  readonly args: string[];
  readonly guildContext: GuildContext;
  readonly musicPlayer: MusicPlayer;
  readonly guild: Guild;
  readonly message: Message;
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

export function handleJoin(ctx: CommandContext) {
  const member = ctx.message.member;
  Assert.notNullOrUndefined(member, "member");

  const voice = member.voice;
  if (!voice.channel) {
    return buildErrorNotInVoiceChannel();
  }
  ctx.musicPlayer.subscribeChannel(voice.channel);
  return buildJoinResponse(voice.channel.name);
}

export function handleLeave(ctx: CommandContext) {
  if (!ctx.musicPlayer.hasSubscribedChannel()) {
    return buildErrorNotConnectedToVoiceChannel();
  }
  const channelId = ctx.musicPlayer.getSubscribedChannelId();
  const channel = ctx.guild.channels.cache.get(channelId);
  Assert.notNullOrUndefined(channel, "channel");
  ctx.musicPlayer.unsubscribeChannel();
  return buildLeaveResponse(channel.name);
}

export function handleNowPlaying(ctx: CommandContext) {
  const nowPlaying = ctx.musicPlayer.getNowPlaying();
  if (!nowPlaying) {
    return buildErrorNotPlaying();
  }
  return buildNowPlayingResponse(nowPlaying);
}

export async function handlePlay(ctx: CommandContext): Promise<BaseMessageOptions> {
  const requester = ctx.message.author;
  if (ctx.args.length === 0) {
    return {
      content: "Usage !play <youtube url> OR !play <search query>",
    };
  }

  let track: YouTubeTrack | null = null;
  if (ctx.args.length === 1) {
    const possibleYouTubeUrl = ctx.args[0];
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
    const query = ctx.args.join(" ");
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

  const requesterVoiceChannel = ctx.message.member?.voice?.channel ?? null;
  if (!ctx.musicPlayer.hasSubscribedChannel()) {
    if (!requesterVoiceChannel) {
      return buildErrorNotInVoiceChannel();
    }
    ctx.musicPlayer.subscribeChannel(requesterVoiceChannel);
  }

  // Change channel is requester is connected to a different voice channel.
  if (ctx.musicPlayer.hasSubscribedChannel()) {
    if (requesterVoiceChannel && ctx.musicPlayer.getSubscribedChannelId() !== requesterVoiceChannel.id) {
      ctx.musicPlayer.subscribeChannel(requesterVoiceChannel);
    }
  }

  const playOrAddResult = await ctx.musicPlayer.playOrAddToQueue(track);
  if (playOrAddResult.isErr()) {
    return buildTrackContentError();
  }
  const positionInQueue = playOrAddResult.value;
  if (positionInQueue === 0) {
    return buildNowPlayingResponse(track);
  }
  return buildQueuedResponse(positionInQueue, track);
}

export function handleStop(ctx: CommandContext) {
  if (ctx.musicPlayer.getState() !== MusicPlayerState.Playing) {
    return buildErrorNotPlaying();
  }
  ctx.musicPlayer.stop();
  return buildStopResponse();
}

export async function handleSkip(ctx: CommandContext): Promise<BaseMessageOptions> {
  const nowPlaying = ctx.musicPlayer.getNowPlaying();
  if (!nowPlaying) {
    return buildErrorNotPlaying();
  }
  const playResult = await ctx.musicPlayer.playNextOrStop();
  if (playResult.isErr()) {
    return buildTrackContentError();
  }
  return buildSkipResponse(nowPlaying);
}

export function handleQueue(ctx: CommandContext) {
  const queuedTracks = ctx.musicPlayer.getQueuedTracks();
  const nowPlaying = ctx.musicPlayer.getNowPlaying();
  return buildQueueResponse(queuedTracks, nowPlaying);
}
