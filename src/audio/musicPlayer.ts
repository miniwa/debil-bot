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
import { err, ok, Result } from "../result";
import { MusicSubscription } from "./musicSubscription";
import { ITrack, TrackContentError, TrackContentNotAvailableError } from "./track";
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

export interface MusicPlayerEvents {
  error: (error: Error) => void;
}

export class MusicPlayer {
  private onErrorListeners: ((error: Error) => void)[];
  private state: MusicPlayerState;
  private audioPlayer: AudioPlayer;
  private trackQueue: TrackQueue;
  private nowPlaying: ITrack | null;
  private subscription: MusicSubscription | null;

  constructor() {
    this.onErrorListeners = [];
    this.state = MusicPlayerState.Idle;
    this.audioPlayer = createAudioPlayer();
    this.audioPlayer.on("error", (error) => {
      logger.warn("Unhandled AudioPlayer error", formatErrorMeta(error));
      this.stop();
      this.emitOnError(error);
    });
    this.audioPlayer.on(AudioPlayerStatus.Idle, async (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Playing && this.state === MusicPlayerState.Playing) {
        const playResult = await this.playNextOrStop();
        if (playResult.isErr()) {
          const reason = playResult.error.reason;
          this.stop();
          this.emitOnError(new Error(reason));
        }
      }
    });
    this.trackQueue = new TrackQueue();
    this.nowPlaying = null;
    this.subscription = null;
  }

  onError(listener: (error: Error) => void) {
    this.onErrorListeners.push(listener);
  }

  private emitOnError(error: Error) {
    for (const listener of this.onErrorListeners) {
      listener(error);
    }
  }

  getState() {
    return this.state;
  }

  subscribeChannel(channel: VoiceBasedChannel) {
    if (this.subscription) {
      if (this.subscription.channelId === channel.id) {
        return;
      }
      this.subscription.destroy();
    }
    this.subscription = MusicSubscription.create(channel, this.audioPlayer);
  }

  unsubscribeChannel() {
    if (!this.subscription) {
      throw new MusicPlayerError("Channel is not subscribed to MusicPlayer");
    }
    this.subscription.destroy();
    this.subscription = null;
  }

  hasSubscribedChannel(): boolean {
    return this.subscription !== null;
  }

  getSubscribedChannelId(): string {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    return this.subscription.channelId;
  }

  async playTrack(track: ITrack): Promise<Result<null, TrackContentError>> {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    const resourceResult = await track.createAudioResource();
    if (resourceResult.isErr()) {
      return err(resourceResult.error);
    }
    this.audioPlayer.play(resourceResult.value);
    this.nowPlaying = track;
    this.state = MusicPlayerState.Playing;
    return ok(null);
  }

  /**
   * Either immidietly plays given track, or if already playing a track, adds given track to the queue.
   * @param track Track to be played or added to queue.
   * @returns Position in queue. 0 means the track was played immideitly.
   */
  async playOrAddToQueue(track: ITrack): Promise<Result<number, TrackContentError>> {
    const nowPlaying = this.getNowPlaying();
    if (!nowPlaying) {
      const playResult = await this.playTrack(track);
      if (playResult.isErr()) {
        return err(playResult.error);
      }
      return ok(0);
    } else {
      this.addTrack(track);
      return ok(this.getQueueLength());
    }
  }

  async playNextOrStop(): Promise<Result<boolean, TrackContentError>> {
    const nextTrack = this.getNextTrack();
    if (nextTrack) {
      const playResult = await this.playTrack(nextTrack);
      if (playResult.isErr()) {
        return err(playResult.error);
      }
      return ok(true);
    } else {
      this.stop();
      return ok(false);
    }
  }

  stop() {
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
