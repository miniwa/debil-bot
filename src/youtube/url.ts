import { err, ok, Result } from "../result";

export class YouTubeVideoId {
  readonly raw: string;

  constructor(raw: string) {
    this.raw = raw;
  }
}

interface IVideoIdParseError {
  uiMessage: string;
}

export function parseYouTubeVideoId(rawUrl: string): Result<YouTubeVideoId, IVideoIdParseError> {
  let youtubeUrl: URL;
  try {
    youtubeUrl = new URL(rawUrl);
  } catch {
    return err({
      uiMessage: "Enter a valid URL",
    });
  }

  const hostname = youtubeUrl.hostname;
  if (hostname === "www.youtube.com" || hostname === "music.youtube.com") {
    const videoId = youtubeUrl.searchParams.get("v");
    if (!videoId) {
      return err({
        uiMessage: "Video id parameter missing from YouTube URL",
      });
    }
    return ok(new YouTubeVideoId(videoId));
  } else if (hostname === "youtu.be") {
    const pathName = youtubeUrl.pathname;
    const parts = pathName.split("/");
    if (parts.length !== 2) {
      return err({
        uiMessage: "Enter a valid shorthand URL",
      });
    }
    return ok(new YouTubeVideoId(parts[1]));
  } else {
    return err({
      uiMessage: "Only YouTube URLs are supported",
    });
  }
}
