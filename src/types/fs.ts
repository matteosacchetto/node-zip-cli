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
  | {
      type: 'symlink';
      link_path: string;
      link_name: string;
    }
);

export type ArchiveEntry = Omit<
  FsEntry,
  'n_children' | 'type' | 'link_path' | 'link_name'
> &
  (
    | {
        type: 'file' | 'directory';
      }
    | {
        type: 'symlink';
        link_path: string;
        link_name: string;
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
        link_name: string;
        link_mode: number | undefined;
      });
};

export type ConflictingFsEntry = {
  conflicting_path: string;
  conflicting_with_path: string;
};

export type CleanedEntryWithMode = {
  cleaned_path: string;
  mode: number;
};

export type BrokenSymlink = {
  cleaned_path: string;
  link_name: string;
};

export type SymlinkOption = 'none' | 'resolve' | 'keep';
export type KeepParentOption = 'full' | 'last' | 'none';
