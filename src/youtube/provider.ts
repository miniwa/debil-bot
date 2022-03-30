import { User } from "discord.js";
import Enumerable from "linq";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import { TrackLength } from "../audio/track";
import { formatErrorMeta, logger } from "../logger";
import { Assert } from "../misc/assert";
import { err, ok, Result } from "../result";
import { YouTubeTrack } from "./track";
import { YouTubeVideoId } from "./url";

export interface YouTubeNotAvailableError {
  kind: "YTNotAvailable";
}

export type YouTubeTrackByIdError = YouTubeNotAvailableError;

export interface YouTubeNoResultError {
  kind: "YTNoResult";
}

export type YouTubeSearchError = YouTubeTrackByIdError | YouTubeNoResultError;

export class YouTubeProvider {
  async search(query: string, requester: User): Promise<Result<YouTubeTrack, YouTubeSearchError>> {
    const profile = logger.startTimer();
    Assert.checkCondition(query !== "", "Expected query to not be empty string");
    logger.debug("Searching YouTube", {
      query: query,
    });

    let searchResult: ytsr.Result;
    try {
      searchResult = await ytsr(query, { limit: 10 });
    } catch (error) {
      return err({
        kind: "YTNotAvailable",
      });
    }
    const videos = Enumerable.from(searchResult.items)
      .where((item) => item.type === "video")
      .cast<ytsr.Video>()
      .toArray();

    if (videos.length === 0) {
      logger.debug("Query did not find any results", {
        query: query,
      });
      return err({
        kind: "YTNoResult",
      });
    }
    const video = videos[0];
    logger.debug("Query found video", {
      query: query,
      video: video,
    });
    const videoId = new YouTubeVideoId(video.id);
    const trackResult = await this.byVideoId(videoId, requester);
    profile.done({ level: "debug", message: "YouTubeProvider.search profile" });
    return trackResult;
  }

  async byVideoId(videoId: YouTubeVideoId, requester: User): Promise<Result<YouTubeTrack, YouTubeTrackByIdError>> {
    const profile = logger.startTimer();
    const url = `https://www.youtube.com/watch?v=${videoId.raw}`;
    logger.debug(`Calling getInfo for id=${videoId.raw}`, {
      youtubeVideoId: videoId.raw,
    });

    let info: ytdl.videoInfo;
    try {
      info = await ytdl.getInfo(url);
    } catch (error) {
      logger.debug("Unexpected exception thrown by ytdl.getInfo", formatErrorMeta(error));
      return err({
        kind: "YTNotAvailable",
      });
    }
    logger.debug("Video info received", { youtubeVideoId: videoId });

    const name = info.videoDetails.title;
    const lengthInSeconds = parseInt(info.videoDetails.lengthSeconds);
    Assert.checkCondition(!isNaN(lengthInSeconds), "Expected length not to be NaN");
    const length = new TrackLength(lengthInSeconds);
    const track = new YouTubeTrack(name, url, length, requester, info);
    logger.debug("Created new YouTubeTrack", {
      trackName: track.getName(),
      trackUrl: track.getUrl(),
      trackLength: track.getLength(),
      requester: track.getRequester(),
    });
    profile.done({ level: "debug", message: "YouTubeProvider.byVideoId profile" });
    return ok(track);
  }
}
