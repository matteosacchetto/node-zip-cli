import { opendir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readAccess } from '@/utils/fs-utils';
import ignore, { type Ignore } from 'ignore';

const loadIgnoreRules = async (path: string) => {
  if (await readAccess(path)) {
    const gitignoreContent = `${await readFile(path, {
      encoding: 'utf-8',
    })}\n`;
    return gitignoreContent.split('\n');
  }

  return [] as string[];
};

const listDirContent = async (dir: string, parentRules: string[] = []) => {
  const gitingoreRules = [...parentRules];
  const gitignoreFilter: Ignore = ignore();

  for (const ingoreFile of ['.gitignore', '.zipignore']) {
    gitingoreRules.push(...(await loadIgnoreRules(join(dir, ingoreFile))));
  }

  // Add all rules
  gitignoreFilter.add(gitingoreRules);

  const entrties = await opendir(dir);
  const walk: string[] = [];
  for await (const entry of entrties) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!gitignoreFilter.ignores(entryPath + '/')) {
        const subwalk = await listDirContent(entryPath, gitingoreRules);
        walk.push(...subwalk);
      }
    } else if (entry.isFile()) {
      if (!gitignoreFilter.ignores(entryPath)) {
        walk.push(entryPath);
      }
    }
  }

  return walk;
};

export const scanFs = async (rootDir: string, defaultExclude?: string[]) => {
  const cwd = process.cwd();
  try {
    const dir = join(cwd, rootDir);
    await (await opendir(rootDir)).close();
    process.chdir(dir);
    const walk = await listDirContent('.', defaultExclude);
    const files = walk.map((el: string) => join(rootDir, el));

    return files;
  } finally {
    process.chdir(cwd);
  }
};
