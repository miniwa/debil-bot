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
  private subscription: MusicSubscription | null;

  constructor() {
    this.state = MusicPlayerState.Idle;
    this.audioPlayer = createAudioPlayer();
    this.audioPlayer.on("error", (error) => {
      logger.warn("Unhandled AudioPlayer error", formatErrorMeta(error));
    });
    this.audioPlayer.on("stateChange", async (oldState: AudioPlayerState, newState: { status: any }) => {
      if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
        // Play next track in queue.
        if (this.state === MusicPlayerState.Playing) {
          if (this.trackQueue.length() > 0) {
            await this.playNext();
          } else {
            this.state = MusicPlayerState.Idle;
          }
        }
      }
    });
    this.trackQueue = new TrackQueue();
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
    const resource = await track.createAudioResource();
    this.audioPlayer.play(resource);
    this.state = MusicPlayerState.Playing;
  }

  async playNext() {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    const nextTrack = this.trackQueue.next();
    await this.playTrack(nextTrack);
  }

  addTrack(track: ITrack) {
    this.trackQueue.add(track);
  }

  stop() {
    this.state = MusicPlayerState.Idle;
    if (!this.audioPlayer.stop()) {
      logger.warn("audioPlayer.stop() returned false");
    }
  }
}
