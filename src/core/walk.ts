import { lstat, opendir, readFile, readlink, realpath } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import type {
  CleanedEntryWithMode,
  ConflictingFsEntry,
  DisableIgnoreOption,
  FsEntry,
  KeepParentOption,
  SymlinkOption,
} from '@/types/fs';
import { boolean_filter } from '@/utils/filter';
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
import ignore, { type Ignore } from 'ignore';

const load_ignore_rules = async (path: string) => {
  if (await read_access(path)) {
    const gitignore_content = `${await readFile(path, {
      encoding: 'utf-8',
    })}\n`;
    return gitignore_content.split('\n').filter(boolean_filter);
  }

  return [] as string[];
};

export const create_file = async (
  path: string,
  name: string,
  is_windows: boolean
): Promise<Extract<FsEntry, { type: 'file' }>> => {
  const { uid, gid, mode, mtime, size } = await lstat(path);
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

export const create_dir = async (
  path: string,
  name: string,
  n_children: number,
  is_windows: boolean
): Promise<Extract<FsEntry, { type: 'directory' }>> => {
  const { uid, gid, mode, mtime, size } = await lstat(path);
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

export const create_symlink = async (
  path: string,
  name: string,
  is_windows: boolean
): Promise<Extract<FsEntry, { type: 'symlink' }>> => {
  const { uid, gid, mode, mtime, size } = await lstat(path);
  const link_path = normalize(await readlink(path));
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
  parent_rules: string[],
  disable_ignore: DisableIgnoreOption
) => {
  const gitingore_rules = [...parent_rules];
  const gitignore_filter: Ignore = ignore({
    ignoreCase: false,
  });

  gitignore_filter.add(gitingore_rules);

  const stats = await lstat(path);

  const fs_entries: FsEntry[] = [];
  let n_children = 0;

  if (
    (path_name !== '' && gitignore_filter.ignores(path_name)) ||
    !(await read_access(path))
  ) {
    return {
      entries: fs_entries,
      n_children,
    };
  }

  if (stats.isFile()) {
    n_children++;
    fs_entries.push(await create_file(path, path_name, is_windows));
  } else if (stats.isDirectory()) {
    const children_rules = [...gitingore_rules];
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

    const children = await opendir(path);

    let sub_n_children = 0;
    for await (const child_entry of children) {
      const res = await walk(
        join(path, child_entry.name),
        join(path_name, child_entry.name),
        is_windows,
        symlink,
        children_rules,
        disable_ignore
      );
      sub_n_children += res.n_children;
      fs_entries.push(...res.entries);
    }
    n_children += sub_n_children;

    if (sub_n_children > 0) {
      fs_entries.push(
        await create_dir(path, path_name, sub_n_children, is_windows)
      );
    }
  } else if (stats.isSymbolicLink()) {
    switch (symlink) {
      case 'keep': {
        n_children++;
        fs_entries.push(await create_symlink(path, path_name, is_windows));
        break;
      }

      case 'resolve': {
        const actual_path = await realpath(path);
        const res = await walk(
          relative(process.cwd(), actual_path),
          path_name,
          is_windows,
          symlink,
          parent_rules,
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

  const non_empty_list: FsEntry[] = [];
  for (const entry_path of unique_input_entries) {
    const entry_name = clean_path(entry_path);
    const res = await walk(
      entry_path,
      entry_name,
      is_windows,
      symlink,
      default_rules,
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
