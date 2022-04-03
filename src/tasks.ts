import { guildContexts } from "./context";
import { logger } from "./logger";

export function destroyIdleGuildContextsTask(maxIdleTimeSeconds: number) {
  logger.debug("Initializing destroyIdleGuildContextsTask");
  return setInterval(() => {
    const contexts = guildContexts.values();
    const idsToDelete: string[] = [];
    // Check for contexts where max time has been reached.
    for (const context of contexts) {
      const timeIdle = context.getTimeIdle();
      if (timeIdle && timeIdle > maxIdleTimeSeconds) {
        context.destroy();
        idsToDelete.push(context.getGuildId());
      }
    }

    // Remove contexts that were destroyed in the above loop.
    for (const guildId of idsToDelete) {
      if (!guildContexts.delete(guildId)) {
        logger.warn("guildContexts.delete returned false");
      }
    }
    if (idsToDelete.length !== 0) {
      logger.debug(`${idsToDelete.length} guild contexts were removed due to being idle.`);
    }
  }, 60_000); // Once every minute.
}
