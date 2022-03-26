import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import { ITrack } from "../audio/track";
import { logger } from "../logger";
import { YouTubeVideoId } from "./url";

export class YouTubeTrack implements ITrack {
  private name: string;
  private videoInfo: ytdl.videoInfo;

  private constructor(name: string, videoInfo: ytdl.videoInfo) {
    this.name = name;
    this.videoInfo = videoInfo;
  }

  getName(): string {
    return this.name;
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

  static async create(videoId: YouTubeVideoId): Promise<YouTubeTrack> {
    const url = `https://www.youtube.com/watch?v=${videoId.raw}`;
    const info = await ytdl.getInfo(url);
    logger.debug("Video info received", { youtubeVideoId: videoId });
    return new YouTubeTrack(info.videoDetails.title, info);
  }
}
