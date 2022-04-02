import { MusicPlayer } from "./audio/musicPlayer";

export class GuildContext {
  private guildId: string;
  private musicPlayer: MusicPlayer;
  private timeLastCommandReceived: number;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.musicPlayer = new MusicPlayer();
    this.timeLastCommandReceived = 0;
  }

  getGuildId(): string {
    return this.guildId;
  }

  getMusicPlayer(): MusicPlayer {
    return this.musicPlayer;
  }

  /**
   * @returns The amount of time this context has been idle in seconds, or null if the context is not considered idle.
   */
  getTimeIdle(): number | null {
    const now = Date.now();
    const musicPlayerTimeIdled = this.musicPlayer.getTimeIdle();
  }

  destroy() {}
}
