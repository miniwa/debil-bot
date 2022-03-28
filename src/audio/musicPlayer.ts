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
          await this.playNextOrStop();
        }
      }
    });
    this.trackQueue = new TrackQueue();
    this.nowPlaying = null;
    this.subscription = null;
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

  async playTrack(track: ITrack) {
    Assert.notNullOrUndefined(this.subscription, "subscription");
    const resource = await track.createAudioResource();
    this.audioPlayer.play(resource);
    this.nowPlaying = track;
    this.state = MusicPlayerState.Playing;
  }

  /**
   * Either immidietly plays given track, or if already playing a track, adds given track to the queue.
   * @param track Track to be played or added to queue.
   * @returns Position in queue. 0 means the track was played immideitly.
   */
  async playOrAddToQueue(track: ITrack): Promise<number> {
    const nowPlaying = this.getNowPlaying();
    if (!nowPlaying) {
      await this.playTrack(track);
      return 0;
    } else {
      this.addTrack(track);
      return this.getQueueLength();
    }
  }

  async playNextOrStop() {
    const nextTrack = this.getNextTrack();
    if (nextTrack) {
      await this.playTrack(nextTrack);
    } else {
      this.stop();
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
