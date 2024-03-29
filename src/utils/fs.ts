import { createReadStream } from 'node:fs';
import {
  constants,
  access,
  chmod,
  chown,
  lstat,
  utimes,
  symlink,
  rm,
} from 'node:fs/promises';
import { isAbsolute, normalize, parse, resolve } from 'node:path';
import type { ConflictingFsEntry, FsEntry } from '@/types/fs';
import { ignore_on_error } from './process';

export const unique_fs_entries = (
  list: FsEntry[]
): [FsEntry[], ConflictingFsEntry[]] => {
  const sorted_list = list.sort((a, b) =>
    a.cleaned_path.localeCompare(b.cleaned_path)
  );
  const final_list: FsEntry[] = [];
  const conflicting_list: ConflictingFsEntry[] = [];

  for (let i = 0; i < sorted_list.length; i++) {
    if (sorted_list[i].cleaned_path !== final_list.at(-1)?.cleaned_path) {
      final_list.push(sorted_list[i]);
    } else {
      if (resolve(sorted_list[i].path) !== resolve(final_list.at(-1)!.path)) {
        conflicting_list.push({
          conflicting_path: sorted_list[i].path,
          conflicting_with_path: final_list.at(-1)!.path,
        });
      }
    }
  }

  return [final_list, conflicting_list];
};

export const unique_entries = (list: string[]) => {
  const paths = list.map((el) => ({
    path: el,
    absolute_path: resolve(el),
  }));

  const unique_paths: Record<string, string> = {};
  for (const path of paths) {
    if (
      unique_paths[path.absolute_path] === undefined ||
      path.path.length < unique_paths[path.absolute_path].length
    ) {
      unique_paths[path.absolute_path] = path.path;
    }
  }

  return Object.entries(unique_paths).map((el) => el[1]);
};

export const exists = async (p: string) => {
  try {
    return !!(await lstat(p));
  } catch (e) {
    return false;
  }
};

export const is_directory = async (p: string) => {
  try {
    return (await lstat(p)).isDirectory();
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

/**
 * This function is a modified version of the implementation in node-tar
 *
 * @link https://github.com/isaacs/node-tar/blob/main/lib/strip-absolute-path.js
 */
export const clean_path = (path: string) => {
  let final_path = path;

  if (isAbsolute(path)) {
    let parsed_path = parse(final_path);
    while (isAbsolute(final_path) || parsed_path.root) {
      const root =
        final_path.charAt(0) === '/' && final_path.slice(0, 4) !== '//?/'
          ? '/'
          : parsed_path.root;
      final_path = final_path.slice(root.length);
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
  type: 'file' | 'directory' | 'symlink',
  now: Date
): Omit<FsEntry['stats'], 'size'> => {
  return {
    uid: 1000,
    gid: 1000,
    mode: get_default_mode(type),
    mtime: now,
  };
};

export const get_default_mode = (
  type: 'file' | 'directory' | 'symlink'
): number => {
  if (type === 'file') {
    return 0o100664;
  }

  if (type === 'symlink') {
    return 0o120777;
  }

  return 0o40775;
};

export const read_file_partial = async (
  path: string,
  opts: {
    start?: number | undefined;
    end?: number | undefined;
    encoding?: BufferEncoding | undefined;
  }
) => {
  const stream = createReadStream(path, {
    start: opts.start,
    end: opts.end,
    encoding: opts.encoding,
  });

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  stream.close();

  return Buffer.concat(chunks);
};

export const fix_mode = (mode: number, is_windows: boolean) => {
  if (is_windows) {
    const type = (mode & 0o770000) >> 12;

    switch (type) {
      case 4: {
        // Directory
        return 0o40775;
      }

      case 8: {
        // File
        return 0o100664;
      }

      case 10: {
        //Symlink
        return 0o120777;
      }
    }
  }

  return mode;
};

export const set_permissions = async (
  path: string,
  {
    mode,
    mtime,
    uid,
    gid,
  }: {
    mode?: string | number | null | undefined;
    mtime?: Date | null | undefined;
    uid?: number | null | undefined;
    gid?: number | null | undefined;
  }
) => {
  if (mode) await ignore_on_error(() => chmod(path, mode));
  if (mtime) await ignore_on_error(() => utimes(path, mtime, mtime));
  if (uid && gid) await ignore_on_error(() => chown(path, uid, gid));
};

export const overwrite_symlink_if_exists = async (
  target: string,
  path: string
) => {
  await rm(path, { force: true });
  await symlink(target, path);
};
