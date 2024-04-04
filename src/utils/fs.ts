import { createReadStream } from 'node:fs';
import {
  constants,
  access,
  chmod,
  chown,
  lstat,
  readlink,
  rm,
  symlink,
  utimes,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  join,
  normalize,
  parse,
  resolve,
} from 'node:path';
import type {
  ArchiveEntry,
  BrokenSymlink,
  CleanedEntryWithMode,
  ConflictingFsEntry,
  FsEntry,
} from '@/types/fs';
import { ignore_on_error } from './process';

/**
 * The lower the number the higher the priority
 */
export const get_priority_for_type = (
  type: 'directory' | 'file' | 'symlink'
) => {
  switch (type) {
    case 'directory':
      return 1;
    case 'file':
      return 2;
    case 'symlink':
      return 3;
  }
};

export const type_compare = (
  a: 'directory' | 'file' | 'symlink',
  b: 'directory' | 'file' | 'symlink'
) => {
  return get_priority_for_type(a) - get_priority_for_type(b);
};

export const unique_fs_entries = (
  list: FsEntry[]
): [FsEntry[], ConflictingFsEntry[]] => {
  const sorted_list = list.sort((a, b) => {
    let cmp = a.cleaned_path.localeCompare(b.cleaned_path);
    if (cmp === 0) {
      cmp = type_compare(a.type, b.type);
    }

    return cmp;
  });
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

export const map_absolute_path_to_clean_entry_with_mode = (
  list: (FsEntry | ArchiveEntry)[]
): Map<string, CleanedEntryWithMode> => {
  const absolute_path_to_clean_entry_with_mode = new Map<
    string,
    CleanedEntryWithMode
  >();

  for (const entry of list) {
    absolute_path_to_clean_entry_with_mode.set(resolve(entry.path), {
      cleaned_path: entry.cleaned_path,
      mode: entry.stats.mode,
    });
  }

  return absolute_path_to_clean_entry_with_mode;
};

export const broken_symlinks = (
  list: (FsEntry | ArchiveEntry)[],
  absolute_path_to_clean_entry_with_mode: Map<string, CleanedEntryWithMode>
): BrokenSymlink[] => {
  const broken_symlinks_list: BrokenSymlink[] = [];
  for (const entry of list) {
    if (
      entry.type === 'symlink' &&
      !absolute_path_to_clean_entry_with_mode.has(
        resolve(get_symlink_path(entry.path, entry.link_path))
      )
    ) {
      broken_symlinks_list.push({
        cleaned_path: entry.cleaned_path,
        link_name: entry.link_name,
      });
    }
  }

  return broken_symlinks_list;
};

export const exists = async (path: string) => {
  try {
    return !!(await lstat(path));
  } catch (e) {
    return false;
  }
};

export const is_directory = async (path: string) => {
  try {
    return (await lstat(path)).isDirectory();
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

  if (final_path === '.' || final_path === '..') {
    return '';
  }

  if (final_path.startsWith('..')) {
    return final_path.replaceAll('../', '');
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

export const get_symlink_path = (base_path: string, link_path: string) => {
  const base_dir = dirname(base_path);

  if (isAbsolute(link_path)) {
    return link_path;
  }

  return join(base_dir, link_path);
};

export const resolve_symlink = async (path: string) => {
  const base_dir = dirname(path);
  const link_path = await readlink(path);

  return get_symlink_path(base_dir, link_path);
};
