import { opendir, readFile } from 'fs/promises';
import { join } from 'path';
import parseGitignore from 'parse-gitignore';
import ignore, { Ignore } from 'ignore';

const listDirContent = async (dir: string, parentRules: string[] = []) => {
  const gitingoreRules = [...parentRules];
  const gitignoreFilter: Ignore = ignore();

  try {
    // Read a .gitignore
    const gitignorePath = join(dir, '.gitignore');
    const gitignoreContent = await readFile(gitignorePath, {
      encoding: 'utf-8',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patterns = (parseGitignore(gitignoreContent) as any).patterns;
    gitingoreRules.push(...patterns);
  } catch (e) {
    // console.log(e);
  }

  try {
    // Read a .zipignore
    const zipignorePath = join(dir, '.zipignore');
    const zipignoreContent = await readFile(zipignorePath, {
      encoding: 'utf-8',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patterns = (parseGitignore(zipignoreContent) as any).patterns;
    gitingoreRules.push(...patterns);
  } catch (e) {
    // console.log(e);
  }

  // Add all rules
  gitignoreFilter.add(gitingoreRules);

  const entrties = await opendir(dir);
  const walk: string[] = [];
  for await (const entry of entrties) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!gitignoreFilter.ignores(entryPath + '/')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const scanFs = async (rootDir: string) => {
  const cwd = process.cwd();
  try {
    const dir = join(cwd, rootDir);
    await (await opendir(rootDir)).close();
    process.chdir(dir);
    const walk = await listDirContent('.');
    const files = walk.map((el: string) => join(rootDir, el));

    return files;
  } finally {
    process.chdir(cwd);
  }
};
