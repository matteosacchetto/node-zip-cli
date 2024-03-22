import { opendir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { BooleanFilter } from '@/utils/filter';
import {
  clean_path,
  isDirectory,
  isFile,
  read_access,
  unique_fs_entries,
} from '@/utils/fs';
import ignore, { type Ignore } from 'ignore';
import type { FsEntries } from '@/types/fs';

const loadIgnoreRules = async (path: string) => {
  if (await read_access(path)) {
    const gitignoreContent = `${await readFile(path, {
      encoding: 'utf-8',
    })}\n`;
    return gitignoreContent.split('\n').filter(BooleanFilter);
  }

  return [] as string[];
};

const list_dir_content_recursive = async (
  dir: string,
  parentRules: string[] = []
) => {
  const gitingoreRules = [...parentRules];
  const gitignoreFilter: Ignore = ignore();

  for (const ingoreFile of ['.gitignore', '.zipignore']) {
    gitingoreRules.push(...(await loadIgnoreRules(join(dir, ingoreFile))));
  }

  // Add all rules
  gitignoreFilter.add(gitingoreRules);

  const entrties = await opendir(dir);
  const walk: FsEntries[] = [];
  for await (const entry of entrties) {
    const entryPath = join(dir, entry.name);

    if (!(await read_access(entryPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      if (!gitignoreFilter.ignores(`${entryPath}/`)) {
        const { uid, gid, mode, size, mtime } = await stat(entryPath);
        walk.push({
          path: entryPath,
          cleaned_path: entryPath,
          type: 'directory',
          stats: {
            uid,
            gid,
            mode,
            size,
            mtime,
          },
        });
        const subwalk = await list_dir_content_recursive(
          entryPath,
          gitingoreRules
        );
        walk.push(...subwalk);
      }
    } else if (entry.isFile()) {
      if (!gitignoreFilter.ignores(entryPath)) {
        const { uid, gid, mode, size, mtime } = await stat(entryPath);
        walk.push({
          path: entryPath,
          cleaned_path: entryPath,
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

  return walk;
};

const list_dir_content = async (dir: string, parentRules: string[] = []) => {
  const { uid, gid, mode, size, mtime } = await stat(dir);

  const entries: FsEntries[] = [];

  entries.push({
    path: dir,
    cleaned_path: clean_path(dir),
    type: 'directory',
    stats: {
      uid,
      gid,
      mode,
      mtime,
      size,
    },
  });

  entries.push(...(await list_dir_content_recursive(dir, parentRules)));

  return entries;
};

export const scan_fs = async (rootDir: string, defaultExclude?: string[]) => {
  const cwd = process.cwd();
  try {
    process.chdir(rootDir);
    return (await list_dir_content('.', defaultExclude))
      .map((el) => {
        el.path = join(rootDir, el.path);
        el.cleaned_path = clean_path(join(rootDir, el.cleaned_path));
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
  const files: FsEntries[] = [];

  for (const entry of unique_input_entries) {
    let fs_entries: FsEntries[] = [];
    let base_dir = '';

    if (await isDirectory(entry)) {
      const defaultRules = [];
      if (!allow_git) {
        defaultRules.push('.git/');
      }

      if (exclude_list && exclude_list.length > 0) {
        defaultRules.push(...exclude_list);
      }

      fs_entries = await scan_fs(entry, defaultRules);
      base_dir = entry;
    } else if (await isFile(entry)) {
      const path = entry;
      const stats = await stat(path);
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

  return unique_fs_entries(files);
};
