import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import { User } from "discord.js";
import ytdl from "ytdl-core";
import { ITrack, TrackLength } from "../audio/track";
import { logger } from "../logger";
import { Assert } from "../misc/assert";
import { YouTubeVideoId } from "./url";

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

  async createAudioResource(): Promise<AudioResource> {
    const opusFormat = ytdl.chooseFormat(this.videoInfo.formats, {
      filter: (format) => {
        return format.codecs.includes("opus") && format.container === "webm";
      },
      quality: "highestaudio",
    });
    logger.info("Chosen format", { format: opusFormat });
    const bufferSize = 16 * 1024 * 1024;
    const downloadStream = ytdl.downloadFromInfo(this.videoInfo, {
      format: opusFormat,
      highWaterMark: bufferSize,
    });
    //const probeInfo = await demuxProbe(downloadStream);
    const resource = createAudioResource(downloadStream, { inputType: StreamType.WebmOpus, silencePaddingFrames: 10 });
    return resource;
  }
}
