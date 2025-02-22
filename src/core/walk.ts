import type { Stats } from 'node:fs';
import { lstat, opendir, readlink, realpath } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import type {
  CleanedEntryWithMode,
  ConflictingFsEntry,
  DisableIgnoreOption,
  FsEntry,
  KeepParentOption,
  SymlinkOption,
  WalkResult,
} from '@/types/fs';
import type { IgnoreFilter } from '@/types/ignore';
import {
  clean_path,
  fix_mode,
  get_symlink_path,
  is_directory,
  map_absolute_path_to_clean_entry_with_mode,
  read_access,
  unique_fs_entries,
} from '@/utils/fs';
import { clean_base_dir } from '@/utils/path';
import { create_ignore_filter, is_ignored, load_ignore_rules } from './ignore';

export const create_file = (
  path: string,
  name: string,
  stats: Stats,
  is_windows: boolean
): Extract<FsEntry, { type: 'file' }> => {
  const { uid, gid, mode, mtime, size } = stats;
  return {
    path,
    cleaned_path: clean_path(name),
    type: 'file',
    stats: {
      uid,
      gid,
      mode: fix_mode(mode, is_windows),
      mtime,
      size,
    },
  };
};

export const create_dir = (
  path: string,
  name: string,
  stats: Stats,
  n_children: number,
  is_windows: boolean
): Extract<FsEntry, { type: 'directory' }> => {
  const { uid, gid, mode, mtime, size } = stats;
  return {
    path,
    cleaned_path: clean_path(name),
    type: 'directory',
    stats: {
      uid,
      gid,
      mode: fix_mode(mode, is_windows),
      mtime,
      size,
    },
    n_children,
  };
};

export const create_symlink = (
  path: string,
  name: string,
  link: string,
  stats: Stats,
  is_windows: boolean
): Extract<FsEntry, { type: 'symlink' }> => {
  const { uid, gid, mode, mtime, size } = stats;
  const link_path = normalize(link);
  return {
    path,
    cleaned_path: clean_path(name),
    type: 'symlink',
    stats: {
      uid,
      gid,
      mode: fix_mode(mode, is_windows),
      mtime,
      size,
    },
    link_path,
    link_name: link_path,
  };
};

export const walk = async (
  path: string,
  path_name: string,
  is_windows: boolean,
  symlink: SymlinkOption,
  ignore_filters: IgnoreFilter[],
  disable_ignore: DisableIgnoreOption
): Promise<WalkResult> => {
  const stats = await lstat(path);

  const fs_entries: FsEntry[] = [];
  let n_children = 0;

  if (
    (path_name !== '' &&
      is_ignored(path_name, stats.isDirectory(), ignore_filters)) ||
    !(await read_access(path))
  ) {
    return {
      entries: fs_entries,
      n_children,
    };
  }

  if (stats.isFile()) {
    n_children++;
    fs_entries.push(create_file(path, path_name, stats, is_windows));
  } else if (stats.isDirectory()) {
    const children_rules = [];
    for (const ingore_file of ['.gitignore', '.zipignore']) {
      if (
        disable_ignore !== 'all' &&
        disable_ignore !== 'ignore-files' &&
        ((ingore_file === '.gitignore' && disable_ignore !== 'gitignore') ||
          (ingore_file === '.zipignore' && disable_ignore !== 'zipignore'))
      ) {
        children_rules.push(
          ...(await load_ignore_rules(join(path, ingore_file)))
        );
      }
    }

    const children_ignore_filters =
      children_rules.length > 0
        ? [...ignore_filters, create_ignore_filter(path_name, children_rules)]
        : ignore_filters;

    const children = await opendir(path);

    const children_promises: Promise<WalkResult>[] = [];
    for await (const child_entry of children) {
      children_promises.push(
        walk(
          join(path, child_entry.name),
          join(path_name, child_entry.name),
          is_windows,
          symlink,
          children_ignore_filters,
          disable_ignore
        )
      );
    }
    const children_results = await Promise.all(children_promises);

    let sub_n_children = 0;
    for (const res of children_results) {
      sub_n_children += res.n_children;
      fs_entries.push(...res.entries);
    }
    n_children += sub_n_children;

    if (sub_n_children > 0) {
      fs_entries.push(
        create_dir(path, path_name, stats, sub_n_children, is_windows)
      );
    }
  } else if (stats.isSymbolicLink()) {
    switch (symlink) {
      case 'keep': {
        const link = await readlink(path);
        fs_entries.push(
          create_symlink(path, path_name, link, stats, is_windows)
        );
        n_children++;
        break;
      }

      case 'resolve': {
        const actual_path = await realpath(path);
        const res = await walk(
          relative(process.cwd(), actual_path),
          path_name,
          is_windows,
          symlink,
          ignore_filters,
          disable_ignore
        );
        n_children += res.n_children;
        fs_entries.push(...res.entries);
        break;
      }
    }
  }

  return {
    entries: fs_entries,
    n_children,
  };
};

export const list_entries = async (
  unique_input_entries: string[],
  is_windows: boolean,
  keep_parent: KeepParentOption,
  symlink: SymlinkOption,
  allow_git: boolean,
  exclude_list: string[] = [],
  disable_ignore: DisableIgnoreOption = 'none'
): Promise<
  [FsEntry[], ConflictingFsEntry[], Map<string, CleanedEntryWithMode>]
> => {
  const default_rules = [];

  if (!allow_git) {
    default_rules.push('.git/');
  }

  if (disable_ignore !== 'all' && disable_ignore !== 'exclude-rules') {
    if (exclude_list && exclude_list.length > 0) {
      default_rules.push(...exclude_list);
    }
  }

  const ignore_filters = [create_ignore_filter('.', default_rules)];

  const non_empty_list: FsEntry[] = [];
  for (const entry_path of unique_input_entries) {
    const entry_name = clean_path(entry_path);
    const res = await walk(
      entry_path,
      entry_name,
      is_windows,
      symlink,
      ignore_filters,
      disable_ignore
    );
    let entries = res.entries;

    let base_dir = (await is_directory(entry_path))
      ? entry_name
      : dirname(entry_name);

    if (keep_parent === 'none') {
      entries = entries.map((el) => {
        el.cleaned_path = clean_path(relative(base_dir, el.cleaned_path));
        return el;
      });
    } else if (keep_parent === 'last') {
      base_dir = clean_base_dir(base_dir);
      entries.map((el) => {
        el.cleaned_path = clean_path(relative(base_dir, el.cleaned_path));
        return el;
      });
    }

    entries = entries.filter((el) => el.cleaned_path !== '');

    non_empty_list.push(...entries);
  }

  const [unique_list, conflicting_list] = unique_fs_entries(non_empty_list);
  const absolute_path_to_clean_path =
    map_absolute_path_to_clean_entry_with_mode(unique_list);

  // Change symlinks name to match the same transorfmation performed by keep_parent
  for (const entry of unique_list) {
    if (entry.type === 'symlink') {
      const link_path = resolve(get_symlink_path(entry.path, entry.link_path));
      if (absolute_path_to_clean_path.has(link_path)) {
        entry.link_name = relative(
          dirname(entry.cleaned_path),
          absolute_path_to_clean_path.get(link_path)!.cleaned_path
        );
      }
    }
  }

  return [unique_list, conflicting_list, absolute_path_to_clean_path];
};
