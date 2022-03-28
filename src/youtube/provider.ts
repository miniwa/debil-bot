import { User } from "discord.js";
import Enumerable from "linq";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import { TrackLength } from "../audio/track";
import { logger } from "../logger";
import { Assert } from "../misc/assert";
import { YouTubeTrack } from "./track";
import { YouTubeVideoId } from "./url";

export class YouTubeProvider {
  async search(query: string, requester: User): Promise<YouTubeTrack | null> {
    Assert.checkCondition(query !== "", "Expected query to not be empty string");
    logger.debug("Searching YouTube", {
      query: query,
    });
    const searchResult = await ytsr(query, { limit: 10 });
    const videos = Enumerable.from(searchResult.items)
      .where((item) => item.type === "video")
      .cast<ytsr.Video>()
      .toArray();

    if (videos.length === 0) {
      logger.debug("Query did not find any results", {
        query: query,
      });
      return null;
    }
    const video = videos[0];
    logger.debug("Query found video", {
      query: query,
      video: video,
    });
    const videoId = new YouTubeVideoId(video.id);
    return await this.byVideoId(videoId, requester);
  }

  async byVideoId(videoId: YouTubeVideoId, requester: User): Promise<YouTubeTrack> {
    const url = `https://www.youtube.com/watch?v=${videoId.raw}`;
    const info = await ytdl.getInfo(url);
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
    return track;
  }
}
