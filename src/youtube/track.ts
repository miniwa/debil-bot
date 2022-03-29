import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import { User } from "discord.js";
import ytdl from "ytdl-core";
import { ITrack, TrackContentError, TrackContentNotAvailableError, TrackLength } from "../audio/track";
import { formatErrorMeta, logger } from "../logger";
import { Assert } from "../misc/assert";
import { err, ok, Result } from "../result";
import { Readable } from "stream";

export class YouTubeTrack implements ITrack {
  private name: string;
  private url: string;
  private length: TrackLength;
  private requester: User;
  private videoInfo: ytdl.videoInfo;

  constructor(name: string, url: string, length: TrackLength, requester: User, videoInfo: ytdl.videoInfo) {
    this.name = name;
    this.url = url;
    this.length = length;
    this.requester = requester;
    this.videoInfo = videoInfo;
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
    let opusFormat: ytdl.videoFormat;
    try {
      opusFormat = ytdl.chooseFormat(this.videoInfo.formats, {
        filter: (format) => {
          return format.codecs.includes("opus") && format.container === "webm";
        },
        quality: "highestaudio",
      });
    } catch (error) {
      logger.debug("Unexpected error from ytdl.chooseFormat", formatErrorMeta(error));
      const trackContentNotAvailable: TrackContentNotAvailableError = {
        type: "TrackContentNotAvailableError",
        reason: "Could not locate an opus codec with webm container",
      };
      return err(trackContentNotAvailable);
    }

    logger.debug("Chosen format", {
      format: {
        container: opusFormat.container,
        codecs: opusFormat.codecs,
        approxDurationMs: opusFormat.approxDurationMs,
        contentLength: opusFormat.contentLength,
      },
    });
    const bufferSize = 16 * 1024 * 1024;
    let downloadStream: Readable;
    try {
      downloadStream = ytdl.downloadFromInfo(this.videoInfo, {
        format: opusFormat,
        highWaterMark: bufferSize,
      });
    } catch (error) {
      logger.debug("Failed to create download stream", formatErrorMeta(error));
      const contentError: TrackContentNotAvailableError = {
        type: "TrackContentNotAvailableError",
        reason: "Failed to create download stream",
      };
      return err(contentError);
    }

    const resource = createAudioResource(downloadStream, { inputType: StreamType.WebmOpus, silencePaddingFrames: 10 });
    return ok(resource);
  }
}
