import chalk from 'chalk';
import { logger } from '@/logger';
import type { BrokenSymlink } from '@/types/fs';

export const log_broken_symlink = (broken_symlinks_list: BrokenSymlink[]) => {
  if (broken_symlinks_list.length > 0) {
    logger.warning(
      `${broken_symlinks_list.length} broken symlink${
        broken_symlinks_list.length > 1 ? 's' : ''
      }`
    );
    logger.log(
      'The following list of symlinks point to entries not contained in the archive'
    );
    for (const entry of broken_symlinks_list) {
      logger.log(
        `${chalk.cyan(entry.cleaned_path)} -> ${chalk.red(entry.link_name)}`
      );
    }
  }
};
