import { AudioResource } from "@discordjs/voice";
import { User } from "discord.js";
import { Assert } from "../misc/assert";

export interface ITrack {
  getName(): string;
  getUrl(): string;
  getLength(): TrackLength;
  getRequester(): User;
  createAudioResource(): Promise<AudioResource>;
}

export class TrackLength {
  private lengthInSeconds: number;

  constructor(lengthInSeconds: number) {
    Assert.checkCondition(lengthInSeconds >= 0, "Expected length to be greater than or equal to 0 seconds");
    this.lengthInSeconds = lengthInSeconds;
  }

  getSeconds(): number {
    return this.lengthInSeconds;
  }

  getHumanReadable(): string {
    const minutes = Math.floor(this.lengthInSeconds / 60);
    const remainingSeconds = this.lengthInSeconds - minutes * 60;
    return `${addPadding(minutes)}:${addPadding(remainingSeconds)}`;
  }
}

function addPadding(value: number) {
  if (value < 10) {
    return "0" + value.toFixed(0);
  } else {
    return value.toFixed(0);
  }
}
