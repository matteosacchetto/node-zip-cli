import { createReadStream } from 'node:fs';
import { constants, access, stat } from 'node:fs/promises';
import { isAbsolute, normalize, parse, resolve } from 'node:path';
import type { ConflictingFsEntry, FsEntry } from '@/types/fs';

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
    return !!(await stat(p));
  } catch (e) {
    return false;
  }
};

export const is_directory = async (p: string) => {
  try {
    return (await stat(p)).isDirectory();
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
): Omit<FsEntry['stats'], 'size'> => {
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
