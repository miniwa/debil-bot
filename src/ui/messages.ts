import {BaseMessageOptions, EmbedBuilder} from "discord.js";
import {ITrack} from "../audio/track";
import {Assert} from "../misc/assert";

const darkRed = "#870209";

export function buildJoinResponse(channelName: string): BaseMessageOptions {
  return {
    content: `Joining ${channelName}`,
  };
}

export function buildLeaveResponse(channelName: string): BaseMessageOptions {
  return {
    content: `Leaving ${channelName}`,
  };
}

export function buildNowPlayingResponse(track: ITrack): BaseMessageOptions {
  const embed = new EmbedBuilder();
  embed
    .setColor(darkRed)
    .setAuthor({name: "Now playing"})
    .setTitle(track.getName())
    .setURL(track.getUrl())
    .addFields(
      {
        name: "Length",
        value: track.getLength().getHumanReadable(),
        inline: true,
      },
      {
        name: "Requester",
        value: track.getRequester().username,
      }
    );

  return {
    embeds: [embed],
  };
}

export function buildPlayResponse(positionInQueue: number, track: ITrack): BaseMessageOptions {
  const requester = track.getRequester();
  const requesterAvatarUrl = requester.avatarURL();
  Assert.notNullOrUndefined(requesterAvatarUrl, "requesterAvatarUrl");

  const embed = new EmbedBuilder()
    .setColor(darkRed)
    .setAuthor({name: "Added to queue", iconURL: requesterAvatarUrl})
    .setTitle(track.getName())
    .setURL(track.getUrl())
    .addFields(
      {
        name: "Position in queue",
        value: positionInQueue.toFixed(0),
        inline: true,
      },
      {
        name: "Length",
        value: track.getLength().getHumanReadable(),
        inline: true,
      }
    );
  return {
    embeds: [embed],
  };
}

export function buildStopResponse(): BaseMessageOptions {
  const embed = new EmbedBuilder().setColor(darkRed).setDescription("Stopped playing");
  return {
    embeds: [embed],
  };
}

export function buildSkipResponse(skipped: ITrack): BaseMessageOptions {
  const embed = new EmbedBuilder()
    .setColor(darkRed)
    .setAuthor({name: "Skipped"})
    .setTitle(skipped.getName())
    .setURL(skipped.getUrl())
    .addFields(
      {
        name: "Length in queue",
        value: skipped.getLength().getHumanReadable(),
        inline: true,
      },
      {
        name: "Requester",
        value: skipped.getRequester().username,
      }
    );
  return {
    embeds: [embed],
  };
}

function formatTrackName(track: ITrack) {
  return `[${track.getName()}](${track.getUrl()})`;
}

export function buildQueueResponse(queue: ITrack[], nowPlaying: ITrack | null): BaseMessageOptions {
  if (queue.length === 0 && nowPlaying === null) {
    const embed = new EmbedBuilder().setColor(darkRed).setTitle("Queue").setDescription("Empty");
    return {
      embeds: [embed],
    };
  }

  let description = "";
  const embed = new EmbedBuilder().setColor(darkRed).setTitle("Queue");
  if (nowPlaying) {
    const length = nowPlaying.getLength().getHumanReadable();
    const requestedBy = nowPlaying.getRequester().username;
    description += "**Now Playing:**\n";
    description += `${formatTrackName(nowPlaying)} | \`${length} Requested by: ${requestedBy}\`\n\n`;
  }

  if (queue.length > 0) {
    description += "**Queue:**\n";
    queue.forEach((track, index) => {
      const pos = index + 1;
      const length = track.getLength().getHumanReadable();
      const requestedBy = track.getRequester().username;
      description += `\`${pos}.\` ${formatTrackName(track)} | \`${length} Requested by: ${requestedBy}\`\n\n`;
    });
  }
  embed.setDescription(description);

  return {
    embeds: [embed],
  };
}

export function buildErrorNotInVoiceChannel(): BaseMessageOptions {
  return {
    content: "You are not inside a voice channel",
  };
}

export function buildErrorNotConnectedToVoiceChannel(): BaseMessageOptions {
  return {
    content: "Bot is not connected to a voice channel",
  };
}

export function buildErrorNotPlaying(): BaseMessageOptions {
  return {
    content: "Bot is not playing anything",
  };
}

export function buildErrorNoSearchResult(query: string): BaseMessageOptions {
  return {
    content: `No video found for query \`${query}\``,
  };
}

export function buildYouTubeNotAvailable(): BaseMessageOptions {
  return {
    content: "This song is not available. There are many possible reasons why",
  };
}

export function buildTrackContentError(): BaseMessageOptions {
  return {
    content: "There was a problem playing the content of this track",
  };
}

export function buildUiMessageResponse(obj: { uiMessage: string }): BaseMessageOptions {
  return {
    content: obj.uiMessage,
  };
}
