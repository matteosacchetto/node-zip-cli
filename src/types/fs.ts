import type { Stats } from 'node:fs';

export type FsEntries = {
  path: string;
  cleaned_path: string;
  type: 'file' | 'directory';
  stats: Pick<Stats, 'mtime' | 'uid' | 'gid' | 'mode' | 'size'>;
};

export type ConflictingFsEntries = {
  conflicting_path: string;
  conflicting_with_path: string;
};
