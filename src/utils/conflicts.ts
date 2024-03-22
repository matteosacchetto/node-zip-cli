import { logger } from '@/logger';
import type { ConflictingFsEntries } from '@/types/fs';
import chalk from 'chalk';

export const log_conflicts = (conflicting_list: ConflictingFsEntries[]) => {
  logger.warning(
    chalk.bold('The following list of entries conflicts with other entries')
  );
  for (const entry of conflicting_list) {
    logger.log(
      `${chalk.yellow(entry.conflicting_path)} -> ${chalk.green(
        entry.conflicting_with_path
      )}`
    );
  }
};
