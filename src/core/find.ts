import { colorize } from '@/core/dircolors';
import { logger } from '@/logger';
import type { FsEntry } from '@/types/fs';
import { remove_trailing_sep } from '@/utils/fs';

export const printfile_list_as_find = (
  entries: FsEntry[],
  is_windows: boolean,
  color: boolean
) => {
  for (const entry of entries) {
    logger.write(
      color
        ? colorize(
            remove_trailing_sep(entry.path, is_windows ? '\\' : '/'),
            entry.stats.mode,
            is_windows
          )
        : remove_trailing_sep(entry.path, is_windows ? '\\' : '/')
    );
  }
};
