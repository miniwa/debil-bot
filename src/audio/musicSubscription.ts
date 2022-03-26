import { AudioPlayer, joinVoiceChannel, PlayerSubscription, VoiceConnection } from "@discordjs/voice";
import { VoiceBasedChannel, VoiceChannel } from "discord.js";
import { formatErrorMeta, logger } from "../logger";
import { Assert } from "../misc/assert";

export class MusicSubscription {
  readonly channelId: string;
  private voiceConnection: VoiceConnection;
  private subscription: PlayerSubscription;

  private constructor(channelId: string, voiceConnection: VoiceConnection, subscription: PlayerSubscription) {
    this.channelId = channelId;
    this.voiceConnection = voiceConnection;
    this.subscription = subscription;
  }

  static create(channel: VoiceBasedChannel, audioPlayer: AudioPlayer) {
    const voiceConnection = joinVoiceChannel({
      guildId: channel.guildId,
      channelId: channel.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    voiceConnection.on("error", (error) => {
      logger.warn("Unhandled VoiceConnection error", formatErrorMeta(error));
    });
    const subscription = voiceConnection.subscribe(audioPlayer);
    Assert.notNullOrUndefined(subscription, "subscription");
    return new MusicSubscription(channel.id, voiceConnection, subscription);
  }

  destroy() {
    this.subscription.unsubscribe();
    this.voiceConnection.disconnect();
    this.voiceConnection.destroy();
  }
}
