import { MessageEmbed, MessageOptions, MessagePayload, User } from "discord.js";
import { ITrack } from "../audio/track";
import { Assert } from "../misc/assert";

const darkRed = "#870209";

export function buildJoinResponse(channelName: string): MessageOptions {
  return {
    content: `Joining ${channelName}`,
  };
}

export function buildLeaveResponse(channelName: string): MessageOptions {
  return {
    content: `Leaving ${channelName}`,
  };
}

export function buildNowPlayingResponse(track: ITrack): MessageOptions {
  const embed = new MessageEmbed()
    .setColor(darkRed)
    .setAuthor({ name: "Now playing" })
    .setTitle(track.getName())
    .setURL(track.getUrl())
    .addField("Length", track.getLength().getHumanReadable(), true)
    .addField("Requester", track.getRequester().username);
  return {
    embeds: [embed],
  };
}

export function buildPlayResponse(positionInQueue: number, track: ITrack): MessageOptions {
  const requester = track.getRequester();
  const requesterAvatarUrl = requester.avatarURL();
  Assert.notNullOrUndefined(requesterAvatarUrl, "requesterAvatarUrl");

  const embed = new MessageEmbed()
    .setColor(darkRed)
    .setAuthor({ name: "Added to queue", iconURL: requesterAvatarUrl })
    .setTitle(track.getName())
    .setURL(track.getUrl())
    .addField("Position in queue", positionInQueue.toFixed(0), true)
    .addField("Length", track.getLength().getHumanReadable(), true);
  return {
    embeds: [embed],
  };
}

export function buildStopResponse(): MessageOptions {
  const embed = new MessageEmbed().setColor(darkRed).setDescription("Stopped playing");
  return {
    embeds: [embed],
  };
}

function formatTrackName(track: ITrack) {
  return `[${track.getName()}](${track.getUrl()})`;
}

export function buildQueueResponse(queue: ITrack[], nowPlaying: ITrack | null): MessageOptions {
  if (queue.length === 0 && nowPlaying === null) {
    const embed = new MessageEmbed().setColor(darkRed).setTitle("Queue").setDescription("Empty");
    return {
      embeds: [embed],
    };
  }

  let description = "";
  const embed = new MessageEmbed().setColor(darkRed).setTitle("Queue");
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

export function buildErrorNotInVoiceChannel(): MessageOptions {
  return {
    content: "You are not inside a voice channel",
  };
}

export function buildErrorNotConnectedToVoiceChannel(): MessageOptions {
  return {
    content: "Bot is not connected to a voice channel",
  };
}

export function buildErrorNotPlaying(): MessageOptions {
  return {
    content: "Bot is not playing anything",
  };
}
