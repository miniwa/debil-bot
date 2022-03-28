import {
  AudioPlayer,
  AudioPlayerIdleState,
  AudioPlayerPlayingState,
  AudioPlayerState,
  AudioPlayerStatus,
  createAudioPlayer,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceBasedChannel, VoiceChannel } from "discord.js";
import { formatErrorMeta, logger } from "../logger";
import { Assert } from "../misc/assert";
import { MusicSubscription } from "./musicSubscription";
import { ITrack } from "./track";
import { TrackQueue } from "./trackQueue";

class MusicPlayerError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "MusicPlayerError";
  }
}

export enum MusicPlayerState {
  Playing,
  Idle,
}

export class MusicPlayer {
  private state: MusicPlayerState;
  private audioPlayer: AudioPlayer;
  private trackQueue: TrackQueue;
  private nowPlaying: ITrack | null;
  private subscription: MusicSubscription | null;

  constructor() {
    this.state = MusicPlayerState.Idle;
    this.audioPlayer = createAudioPlayer();
    this.audioPlayer.on("error", (error) => {
      logger.warn("Unhandled AudioPlayer error", formatErrorMeta(error));
    });
    this.audioPlayer.on("stateChange", async (oldState: AudioPlayerState, newState: { status: any }) => {
      if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
        if (this.state === MusicPlayerState.Playing) {
          // Play next track in queue.
          const nextTrack = this.getNextTrack();
          if (nextTrack) {
            await this.playTrack(nextTrack);
          } else {
            this.ensureStop();
          }
        }
      }
    });
    this.trackQueue = new TrackQueue();
    this.nowPlaying = null;
    this.subscription = null;
  }

  async onAudioPlayerStateChange(oldState: { status: AudioPlayerStatus }, newState: { status: any }) {}

  getState() {
    return this.state;
  }

  ensureSubscriptionExists(channel: VoiceBasedChannel) {
    if (this.subscription) {
      if (this.subscription.channelId === channel.id) {
        return;
      }
      this.subscription.destroy();
    }
    this.subscription = MusicSubscription.create(channel, this.audioPlayer);
  }

  removeSubscription() {
    if (!this.subscription) {
      throw new MusicPlayerError("Channel is not subscribed to MusicPlayer");
    }
    this.subscription.destroy();
    this.subscription = null;
  }

  subscriptionExists(): boolean {
    return this.subscription !== null;
  }

  getSubscribedChannelId(): string {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    return this.subscription.channelId;
  }

  async playTrack(track: ITrack) {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    const resource = await track.createAudioResource();
    this.audioPlayer.play(resource);
    this.nowPlaying = track;
    this.state = MusicPlayerState.Playing;
  }

  ensureStop() {
    if (this.state === MusicPlayerState.Playing) {
      this.state = MusicPlayerState.Idle;
      this.nowPlaying = null;
      if (!this.audioPlayer.stop()) {
        logger.warn("audioPlayer.stop() returned false");
      }
    }
  }

  addTrack(track: ITrack) {
    this.trackQueue.add(track);
  }

  getNowPlaying(): ITrack | null {
    return this.nowPlaying;
  }

  getQueuedTracks(): ITrack[] {
    return this.trackQueue.getItems();
  }

  getQueueLength(): number {
    return this.trackQueue.length();
  }

  getNextTrack(): ITrack | null {
    if (this.trackQueue.length() === 0) {
      return null;
    } else {
      return this.trackQueue.next();
    }
  }
}
