import { join, normalize, sep } from 'node:path';

export const clean_base_dir = (path: string) => {
  const base_dir = join(path, '..');
  if (base_dir === '..') {
    return '.';
  }

  return base_dir;
};

export const normalize_entries = (paths: string[]) => {
  return paths.map((el) => normalize(el));
};

export const ensure_trailing_separator = (path: string, is_dir: boolean) => {
  return is_dir && !path.endsWith(sep) ? `${path}${sep}` : path;
};
