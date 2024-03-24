import type { Stats } from 'node:fs';

export type FsEntries = {
  path: string;
  cleaned_path: string;
  stats: Pick<Stats, 'mtime' | 'uid' | 'gid' | 'mode' | 'size'>;
} & (
  | {
      type: 'file';
    }
  | {
      type: 'directory';
      n_children: number;
    }
);

export type ArchiveEntries = Omit<FsEntries, 'n_children'>;

export type ConflictingFsEntries = {
  conflicting_path: string;
  conflicting_with_path: string;
};
