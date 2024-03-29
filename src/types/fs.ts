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

export type ArchiveEntry = Omit<FsEntry, 'n_children' | 'type'> &
  (
    | {
        type: 'file' | 'directory';
      }
    | {
        type: 'symlink';
        link_path: string;
      }
  );

export type TreeEntry = Omit<ArchiveEntry, 'stats'> & {
  stats: Pick<Stats, 'mtime' | 'uid' | 'gid' | 'mode'>;
};

export type TreePath = {
  [key: string]:
    | (Omit<TreeEntry, 'type' | 'path' | 'cleaned_path'> & { type: 'file' })
    | (Omit<TreeEntry, 'type' | 'path' | 'cleaned_path'> & {
        type: 'directory';
        children: TreePath;
      })
    | (Omit<TreeEntry, 'type' | 'path' | 'cleaned_path'> & {
        type: 'symlink';
        link_path: string;
      });
};

export type ConflictingFsEntry = {
  conflicting_path: string;
  conflicting_with_path: string;
};
