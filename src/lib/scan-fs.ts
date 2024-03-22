import type { Stats } from 'node:fs';
import { opendir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { BooleanFilter } from '@/utils/filter';
import { clean_path, read_access } from '@/utils/fs';
import ignore, { type Ignore } from 'ignore';

export type FsEntries = {
  path: string;
  cleaned_path: string;
  type: 'file' | 'directory';
  stats: Pick<Stats, 'mtime' | 'uid' | 'gid' | 'mode' | 'size'>;
};

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

  const entries: FsEntries[] = [
    {
      path: dir,
      cleaned_path: dir,
      type: 'directory',
      stats: {
        uid,
        gid,
        mode,
        mtime,
        size,
      },
    },
  ];

  entries.push(...(await list_dir_content_recursive(dir, parentRules)));

  return entries;
};

export const scanFs = async (rootDir: string, defaultExclude?: string[]) => {
  const cwd = process.cwd();
  try {
    const dir = join(rootDir);
    process.chdir(dir);
    return (await list_dir_content('.', defaultExclude)).map((el) => {
      el.path = join(rootDir, el.path);
      el.cleaned_path = clean_path(join(rootDir, el.cleaned_path));
      return el;
    });
  } finally {
    process.chdir(cwd);
  }
};
