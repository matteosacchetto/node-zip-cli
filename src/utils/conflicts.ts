import { logger } from '@/logger';
import type { ConflictingFsEntry } from '@/types/fs';
import chalk from 'chalk';

export const log_conflicts = (conflicting_list: ConflictingFsEntry[]) => {
  logger.warning(
    `${conflicting_list.length} conflicting entrie${
      conflicting_list.length > 1 ? 's' : ''
    }`
  );
  logger.log('The following list of entries conflicts with other entries');

  for (const entry of conflicting_list) {
    logger.log(
      `${chalk.yellow(entry.conflicting_path)} -> ${chalk.green(
        entry.conflicting_with_path
      )}`
    );
  }
};
