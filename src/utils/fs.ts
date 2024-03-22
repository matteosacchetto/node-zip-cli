import { constants, access, stat } from 'node:fs/promises';
import { isAbsolute, normalize, parse } from 'node:path';
import type { FsEntries } from '@/lib/scan-fs';

export const exists = async (p: string) => {
  try {
    return !!(await stat(p));
  } catch (e) {
    return false;
  }
};

export const isDirectory = async (p: string) => {
  try {
    return (await stat(p)).isDirectory();
  } catch (e) {
    return false;
  }
};

export const isFile = async (p: string) => {
  try {
    return (await stat(p)).isFile();
  } catch (e) {
    return false;
  }
};

export const read_access = async (path: string) => {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

export const clean_path = (path: string) => {
  let final_path = path;

  if (isAbsolute(path)) {
    let parsed_path = parse(final_path);
    while (isAbsolute(final_path) || parsed_path.root) {
      const root =
        path.charAt(0) === '/' && path.slice(0, 4) !== '//?/'
          ? '/'
          : parsed_path.root;
      final_path = path.slice(root.length);
      parsed_path = parse(final_path);
    }
    return final_path;
  }

  final_path = normalize(final_path);
  if (final_path.startsWith('..')) {
    final_path = final_path.replaceAll('../', '');
  }

  return final_path;
};

export const get_default_stats = (
  type: 'file' | 'directory',
  now: Date
): Omit<FsEntries['stats'], 'size'> => {
  return {
    uid: 1000,
    gid: 1000,
    mode: get_default_mode(type),
    mtime: now,
  };
};

export const get_default_mode = (type: 'file' | 'directory'): number => {
  if (type === 'file') {
    return 0o100644;
  }

  return 0o40775;
};
