import type { Stats } from 'node:fs';

export type FsEntry = {
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

export type ArchiveEntry = Omit<FsEntry, 'n_children'>;

export type ConflictingFsEntry = {
  conflicting_path: string;
  conflicting_with_path: string;
};
