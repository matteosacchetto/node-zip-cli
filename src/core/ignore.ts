import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type { IgnoreFilter } from '@/types/ignore';
import { boolean_filter } from '@/utils/filter';
import { read_access } from '@/utils/fs';
import { ensure_trailing_separator } from '@/utils/path';
import ignore from 'ignore';

export const load_ignore_rules = async (path: string) => {
  if (await read_access(path)) {
    const gitignore_content = `${await readFile(path, {
      encoding: 'utf-8',
    })}\n`;
    return gitignore_content.split('\n').filter(boolean_filter);
  }

  return [] as string[];
};

export const create_ignore_filter = (
  path: string,
  rules: string[]
): IgnoreFilter => {
  const filter = ignore({
    ignoreCase: false,
  });
  filter.add(rules);

  return {
    path,
    filter,
  };
};

export const is_ignored = (
  path: string,
  is_dir: boolean,
  ignore_filters: IgnoreFilter[]
): boolean => {
  let ignored = false;

  for (let i = ignore_filters.length - 1; i >= 0; i--) {
    let relative_path = relative(ignore_filters[i].path, path);
    if (!relative_path) continue;

    // Needed to make sure we properly handle directories
    if (is_dir) relative_path = ensure_trailing_separator(relative_path);

    const test = ignore_filters[i].filter.test(relative_path);
    ignored = (ignored || test.ignored) && !test.unignored;
    if (test.unignored) break;
    if (ignored) break;
  }

  return ignored;
};
