import { addBreadcrumb, Breadcrumb } from "@sentry/node";
import { MusicPlayer } from "./audio/musicPlayer";
import { logger } from "./logger";
import { Assert } from "./misc/assert";

export const guildContexts = new Map<string, GuildContext>();

export function getOrCreateGuildContext(guildId: string): GuildContext {
  if (!guildContexts.has(guildId)) {
    guildContexts.set(guildId, new GuildContext(guildId));
    logger.debug("Created new GuildContext", {
      guildId: guildId,
    });
  }
  const guildContext = guildContexts.get(guildId);
  Assert.notNullOrUndefined(guildContext, "guildContext");
  return guildContext;
}

export class GuildContext {
  private guildId: string;
  private musicPlayer: MusicPlayer;
  private timeLastCommandReceived: number;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.musicPlayer = new MusicPlayer();
    this.timeLastCommandReceived = Date.now();
    const crumb: Breadcrumb = {
      category: "GuildContext",
      message: "GuildContext was created",
      data: {
        guildId: this.guildId,
      },
    };
    addBreadcrumb(crumb);
    logger.debug("GuildContext was created", {
      guildId: this.guildId,
    });
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
    const musicPlayerTimedlingStarted = this.musicPlayer.getTimeIdlingStarted();
    if (musicPlayerTimedlingStarted === null) {
      return null;
    }

    const musicPlayerIdleTime = now - musicPlayerTimedlingStarted;
    const timeSinceLastCommand = now - this.timeLastCommandReceived;
    return Math.min(musicPlayerIdleTime, timeSinceLastCommand) / 1000;
  }

  markCommandReceived() {
    this.timeLastCommandReceived = Date.now();
  }

  destroy() {
    const crumb: Breadcrumb = {
      category: "GuildContext",
      message: "Destroying GuildContext",
      data: {
        guildId: this.guildId,
      },
    };
    addBreadcrumb(crumb);
    logger.debug("Destroying GuildContext", {
      guildId: this.guildId,
    });
    this.musicPlayer.destroy();
  }
}
