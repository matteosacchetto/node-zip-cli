import { lstat, opendir, readFile, realpath } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { FsEntry } from '@/types/fs';
import { boolean_filter } from '@/utils/filter';
import {
  clean_path,
  fix_mode,
  read_access,
  unique_fs_entries,
} from '@/utils/fs';
import ignore, { type Ignore } from 'ignore';
import { is_windows } from './constants';

const load_ignore_rules = async (path: string) => {
  if (await read_access(path)) {
    const gitignore_content = `${await readFile(path, {
      encoding: 'utf-8',
    })}\n`;
    return gitignore_content.split('\n').filter(boolean_filter);
  }

  return [] as string[];
};

const list_dir_content_recursive = async (
  dir: string,
  parent_rules: string[] = []
) => {
  const gitingore_rules = [...parent_rules];
  const gitignore_filter: Ignore = ignore();

  for (const ingore_file of ['.gitignore', '.zipignore']) {
    gitingore_rules.push(...(await load_ignore_rules(join(dir, ingore_file))));
  }

  // Add all rules
  gitignore_filter.add(gitingore_rules);

  const entrties = await opendir(dir);
  const walk: FsEntry[] = [];
  let n_children = 0;
  for await (const entry of entrties) {
    const entry_path = join(dir, entry.name);

    if (!(await read_access(entry_path))) {
      continue;
    }

    if (entry.isDirectory()) {
      if (!gitignore_filter.ignores(`${entry_path}/`)) {
        const { uid, gid, mode, size, mtime } = await lstat(entry_path);
        const dir_data = <Extract<FsEntry, { type: 'directory' }>>{
          path: entry_path,
          cleaned_path: entry_path,
          type: 'directory',
          stats: {
            uid,
            gid,
            mode: fix_mode(mode, is_windows),
            size,
            mtime,
          },
          n_children: 0,
        };
        walk.push(dir_data);

        const subwalk = await list_dir_content_recursive(
          entry_path,
          gitingore_rules
        );
        dir_data.n_children = subwalk.n_children;
        n_children += subwalk.n_children;
        walk.push(...subwalk.walk);
      }
    } else if (entry.isFile()) {
      if (!gitignore_filter.ignores(entry_path)) {
        n_children++;
        const { uid, gid, mode, size, mtime } = await lstat(entry_path);
        walk.push({
          path: entry_path,
          cleaned_path: entry_path,
          type: 'file',
          stats: {
            uid,
            gid,
            mode,
            size,
            mtime,
          },
        });
      }
    } else if (entry.isSymbolicLink()) {
      if (!gitignore_filter.ignores(entry_path)) {
        n_children++;
        const real_path = await realpath(entry_path);
        const { uid, gid, mode, size, mtime } = await lstat(real_path);
        walk.push({
          path: relative(dir, real_path),
          cleaned_path: entry_path,
          type: 'file',
          stats: {
            uid,
            gid,
            mode,
            size,
            mtime,
          },
        });
      }
    }
  }

  return { walk, n_children };
};

const list_dir_content = async (dir: string, parent_rules: string[] = []) => {
  const { uid, gid, mode, size, mtime } = await lstat(dir);

  const entries: FsEntry[] = [];

  const dir_data = <Extract<FsEntry, { type: 'directory' }>>{
    path: dir,
    cleaned_path: clean_path(dir),
    type: 'directory',
    stats: {
      uid,
      gid,
      mode: fix_mode(mode, is_windows),
      mtime,
      size,
    },
    n_children: 0,
  };
  entries.push(dir_data);

  const subwalk = await list_dir_content_recursive(dir, parent_rules);
  dir_data.n_children = subwalk.n_children;
  entries.push(...subwalk.walk);

  return entries;
};

export const scan_fs = async (root_dir: string, default_exclude?: string[]) => {
  const cwd = process.cwd();
  try {
    process.chdir(root_dir);
    return (await list_dir_content('.', default_exclude))
      .map((el) => {
        el.path = join(root_dir, el.path);
        el.cleaned_path = clean_path(join(root_dir, el.cleaned_path));
        return el;
      })
      .filter((el) => el.cleaned_path !== '.');
  } finally {
    process.chdir(cwd);
  }
};

export const list_entries = async (
  unique_input_entries: string[],
  keep_parent: 'full' | 'last' | 'none',
  allow_git: boolean,
  exclude_list?: string[]
) => {
  const default_rules = [];

  if (!allow_git) {
    default_rules.push('.git/');
  }

  if (exclude_list && exclude_list.length > 0) {
    default_rules.push(...exclude_list);
  }

  const default_filter: Ignore = ignore();
  default_filter.add(default_rules);

  const files: FsEntry[] = [];
  for (const entry of unique_input_entries) {
    let fs_entries: FsEntry[] = [];
    let base_dir = '';

    const stats = await lstat(entry);

    if (stats.isDirectory()) {
      fs_entries = await scan_fs(entry, default_rules);
      base_dir = entry;
    } else if (stats.isFile()) {
      const path = entry;
      if (!default_filter.ignores(path)) {
        fs_entries = [
          {
            path,
            cleaned_path: clean_path(path),
            type: 'file',
            stats,
          },
        ];
        base_dir = dirname(path);
      }
    }

    if (keep_parent === 'none') {
      const base = base_dir;
      fs_entries = fs_entries
        .filter((el) => relative(base, el.path) !== '')
        .map((el) => {
          el.cleaned_path = clean_path(relative(base, el.path));
          return el;
        });
    } else if (keep_parent === 'last') {
      const base = resolve(base_dir).split(sep).slice(0, -1).join(sep);

      fs_entries
        .map((el) => {
          if (dirname(el.path) !== '.') {
            el.cleaned_path = clean_path(relative(base, resolve(el.path)));
          }
          return el;
        })
        .filter((el) => el.cleaned_path !== '.');
    }

    files.push(...fs_entries);
  }

  const non_empty_list = files.filter(
    (el) => el.type === 'file' || (el.type === 'directory' && el.n_children > 0)
  );

  return unique_fs_entries(non_empty_list);
};
