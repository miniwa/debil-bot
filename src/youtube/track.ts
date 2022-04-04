import { AudioResource, createAudioResource } from "@discordjs/voice";
import { User } from "discord.js";
import { ITrack, TrackContentError, TrackContentNotAvailableError, TrackLength } from "../audio/track";
import { formatErrorMeta, logger } from "../logger";
import { err, ok, Result } from "../result";
import { InfoData, SoundCloudStream, stream, video_info, YouTubeStream } from "play-dl";

export class YouTubeTrack implements ITrack {
  private name: string;
  private url: string;
  private length: TrackLength;
  private requester: User;

  constructor(name: string, url: string, length: TrackLength, requester: User) {
    this.name = name;
    this.url = url;
    this.length = length;
    this.requester = requester;
  }

  getName(): string {
    return this.name;
  }

  getUrl(): string {
    return this.url;
  }

  getLength(): TrackLength {
    return this.length;
  }

  getRequester(): User {
    return this.requester;
  }

  async createAudioResource(): Promise<Result<AudioResource, TrackContentError>> {
    const profile = logger.startTimer();
    let ytStream: YouTubeStream | SoundCloudStream;
    try {
      ytStream = await stream(this.url);
    } catch (error) {
      logger.debug("Failed to create download stream", formatErrorMeta(error));
      const contentError: TrackContentNotAvailableError = {
        type: "TrackContentNotAvailableError",
        reason: "Failed to create download stream",
      };
      return err(contentError);
    }
    logger.debug(`Stream created`, {
      streamType: ytStream.type,
    });
    const resource = createAudioResource(ytStream.stream, { inputType: ytStream.type, silencePaddingFrames: 5 });
    profile.done({ level: "debug", message: "YouTubeTrack.createAudioResource profile" });
    return ok(resource);
  }
}
