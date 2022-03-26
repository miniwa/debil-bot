export class YouTubeVideoId {
  readonly raw: string;

  constructor(raw: string) {
    this.raw = raw;
  }
}

export class VideoIdException extends Error {
  readonly uiMessage: string;

  constructor(uiMessage: string) {
    super(uiMessage);
    this.uiMessage = uiMessage;
    this.name = "VideoIdException";
  }
}

// https://youtu.be/7JFtfM9rVvQ
// https://www.youtube.com/watch?v=7JFtfM9rVvQ&list=LL&index=52
export function parseYouTubeVideoId(rawUrl: string): YouTubeVideoId {
  let youtubeUrl: URL;
  try {
    youtubeUrl = new URL(rawUrl);
  } catch {
    throw new VideoIdException("Enter a valid URL");
  }

  if (youtubeUrl.hostname === "www.youtube.com") {
    const videoId = youtubeUrl.searchParams.get("v");
    if (!videoId) {
      throw new VideoIdException("Video id parameter missing from YouTube URL");
    }
    return new YouTubeVideoId(videoId);
  } else if (youtubeUrl.hostname === "youtu.be") {
    const pathName = youtubeUrl.pathname;
    const parts = pathName.split("/");
    if (parts.length !== 2) {
      throw new VideoIdException("Enter a valid shorthand URL");
    }
    return new YouTubeVideoId(parts[1]);
  } else {
    throw new VideoIdException("Only YouTube URLs are supported");
  }
}
