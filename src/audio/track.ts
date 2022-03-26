import { AudioResource } from "@discordjs/voice";

export interface ITrack {
  getName(): string;
  createAudioResource(): Promise<AudioResource>;
}
