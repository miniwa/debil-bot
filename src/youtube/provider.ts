import { User } from "discord.js";
import { InfoData, search, video_basic_info, YouTubeVideo } from "play-dl";
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

    let searchResults: YouTubeVideo[];
    try {
      searchResults = await search(query, {
        limit: 1,
        source: {
          youtube: "video",
        },
      });
    } catch (error) {
      logger.debug("Unexpected error thrown by play-dl.search", formatErrorMeta(error));
      return err({
        kind: "YTNotAvailable",
      });
    }

    if (searchResults.length === 0) {
      logger.debug("Query did not find any results", {
        query: query,
      });
      return err({
        kind: "YTNoResult",
      });
    }
    const video = searchResults[0];
    logger.debug("Query found video", {
      query: query,
      video: video,
    });
    const title = video.title;
    Assert.notNullOrUndefined(title, "title");
    const track = new YouTubeTrack(title, video.url, new TrackLength(video.durationInSec), requester);
    profile.done({ level: "debug", message: "YouTubeProvider.search profile" });
    return ok(track);
  }

  async byVideoId(videoId: YouTubeVideoId, requester: User): Promise<Result<YouTubeTrack, YouTubeTrackByIdError>> {
    const profile = logger.startTimer();
    const url = `https://www.youtube.com/watch?v=${videoId.raw}`;
    let info: InfoData;

    try {
      info = await video_basic_info(url);
    } catch (error) {
      logger.debug("Unexpected exception thrown by video_basic_info", formatErrorMeta(error));
      return err({
        kind: "YTNotAvailable",
      });
    }
    logger.debug("Video info received", { youtubeVideoId: videoId });

    const name = info.video_details.title;
    Assert.notNullOrUndefined(name, "name");
    const lengthInSeconds = info.video_details.durationInSec;
    Assert.checkCondition(!isNaN(lengthInSeconds), "Expected length not to be NaN");
    const length = new TrackLength(lengthInSeconds);
    const track = new YouTubeTrack(name, url, length, requester);
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
