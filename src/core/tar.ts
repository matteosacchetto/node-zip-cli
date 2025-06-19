import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';
import chalk from 'chalk';
import { extract, pack } from 'tar-stream';
import { logger } from '@/logger';
import type { ArchiveEntry, CleanedEntryWithMode, FsEntry } from '@/types/fs';
import { log_broken_symlink } from '@/utils/broken-symlink';
import { boolean_filter } from '@/utils/filter';
import {
  broken_symlinks,
  clean_path,
  get_default_mode,
  map_absolute_path_to_clean_entry_with_mode,
  normalize_windows_path,
  overwrite_symlink_if_exists,
  set_permissions,
} from '@/utils/fs';
import { log_indent } from '@/utils/log';
import { spinner_wrapper } from '@/utils/spinner-wrapper';
import { get_full_mode } from '@/utils/tar';
import { preset_compression_level } from './constants';

export const create_tar = async (
  output_path: string,
  unique_fs_entries: FsEntry[],
  absolute_path_to_clean_entry_with_mode: Map<string, CleanedEntryWithMode>,
  num_files: number,
  gzip: boolean | number,
  is_windows: boolean
) => {
  if (num_files === 0) {
    logger.skip(`Creating ${output_path} file`);

    log_indent({
      indentation_increment: 2,
      fn: () => {
        logger.dimmed_error('Nothing to tar');
      },
    });

    return;
  }

  await spinner_wrapper({
    spinner_text: `Reading (0/${num_files} files)`,
    async fn(spinner) {
      const tar = pack();
      tar.once('error', (err) => tar.destroy(err));

      let i = 0;
      for (const fs_entry of unique_fs_entries) {
        if (fs_entry.type === 'directory') {
          tar.entry({
            name: normalize_windows_path(fs_entry.cleaned_path, is_windows),
            mtime: fs_entry.stats.mtime,
            mode: fs_entry.stats.mode,
            uid: fs_entry.stats.uid,
            gid: fs_entry.stats.gid,
            type: 'directory',
          });
        } else if (fs_entry.type === 'file') {
          spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
            `[${fs_entry.cleaned_path}]`
          )}`;
          const entry = tar.entry({
            name: normalize_windows_path(fs_entry.cleaned_path, is_windows),
            size: fs_entry.stats.size,
            mtime: fs_entry.stats.mtime,
            mode: fs_entry.stats.mode,
            uid: fs_entry.stats.uid,
            gid: fs_entry.stats.gid,
            type: 'file',
          });

          const file_stream = createReadStream(fs_entry.path);
          entry.once('error', (err) => entry.destroy(err));

          for await (const chunk of file_stream) {
            entry.write(chunk);
          }
          entry.end();
        } else if (fs_entry.type === 'symlink') {
          spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
            `[${fs_entry.cleaned_path}]`
          )}`;

          tar.entry({
            name: normalize_windows_path(fs_entry.cleaned_path, is_windows),
            size: fs_entry.stats.size,
            mtime: fs_entry.stats.mtime,
            mode: fs_entry.stats.mode,
            uid: fs_entry.stats.uid,
            gid: fs_entry.stats.gid,
            type: 'symlink',
            linkname: normalize_windows_path(fs_entry.link_name, is_windows),
          });
        }
      }

      tar.finalize();

      const line = [
        async function* () {
          for await (const data of tar) {
            yield data;
          }
        },
        gzip !== false
          ? createGzip({
              level: gzip === true ? preset_compression_level : gzip,
            })
          : undefined,
        createWriteStream(output_path),
      ].filter(boolean_filter);

      spinner.text = `Creating ${output_path} file (${num_files}/${num_files} files)`;
      // @ts-ignore
      // Using async generators with pipeline is supported
      // https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options
      await pipeline(line);
      spinner.text = `Created ${output_path} file (${num_files}/${num_files} files)`;
    },
  });

  const broken_symlinks_list = broken_symlinks(
    unique_fs_entries,
    absolute_path_to_clean_entry_with_mode
  );

  if (broken_symlinks_list.length !== 0) {
    log_broken_symlink(broken_symlinks_list);
  }
};

export const read_tar = async (
  input_path: string,
  is_gzip: boolean
): Promise<[ArchiveEntry[], Map<string, CleanedEntryWithMode>]> => {
  const ex = extract();

  const line = [
    createReadStream(input_path),
    is_gzip ? createGunzip() : undefined,
    ex,
  ].filter(boolean_filter);

  const now = new Date();
  const fs_entries: ArchiveEntry[] = [];
  const pip = pipeline(line);
  for await (const entry of ex) {
    if (
      entry.header.type === 'file' ||
      entry.header.type === 'directory' ||
      entry.header.type === 'symlink'
    ) {
      const fs_entry = <ArchiveEntry>{
        /* c8 ignore next 11 */
        path: normalize(entry.header.name),
        cleaned_path: clean_path(normalize(entry.header.name)),
        type: entry.header.type,
        stats: {
          uid: entry.header.uid ?? 1000,
          gid: entry.header.gid ?? 1000,
          mode:
            entry.header.mode === undefined
              ? get_default_mode(entry.header.type)
              : get_full_mode(entry.header.mode, entry.header.type),
          mtime: entry.header.mtime ?? now,
        },
      };

      /* c8 ignore next 9 */
      if (fs_entry.type === 'symlink') {
        fs_entry.link_path = entry.header.linkname
          ? normalize(entry.header.linkname)
          : '';
        fs_entry.link_name = entry.header.linkname
          ? normalize(entry.header.linkname)
          : '';
      }

      fs_entries.push(fs_entry);
    }

    entry.resume();
  }
  await pip;

  const absolute_path_to_clean_entry_with_mode =
    map_absolute_path_to_clean_entry_with_mode(fs_entries);

  return [fs_entries, absolute_path_to_clean_entry_with_mode];
};

export const extract_tar = async (
  input_path: string,
  output_dir: string,
  is_gzip: boolean,
  is_windows: boolean
) => {
  const broken_symlinks_list = await spinner_wrapper({
    spinner_text: `Extracting ${input_path} file to ${output_dir}`,
    async fn(spinner) {
      const [filenames, absolute_path_to_clean_entry_with_mode] =
        await read_tar(input_path, is_gzip);
      const num_files = filenames.filter(
        (el) => el.type !== 'directory'
      ).length;

      const ex = extract();

      const line = [
        createReadStream(input_path),
        is_gzip ? createGunzip() : undefined,
        ex,
      ].filter(boolean_filter);

      const pip = pipeline(line);
      let i = 0;
      for await (const entry of ex) {
        switch (entry.header.type) {
          case 'directory': {
            const dir = join(
              output_dir,
              clean_path(normalize(entry.header.name))
            );
            const { mtime, uid, gid, mode } = entry.header;
            await mkdir(dir, { recursive: true });

            await set_permissions(dir, {
              mode,
              mtime,
              uid,
              gid,
            });

            break;
          }

          case 'file': {
            const filename = clean_path(normalize(entry.header.name));
            spinner.text = `Extracting ${input_path} file to ${output_dir} (${++i}/${num_files} files) ${chalk.dim(
              `[${filename}]`
            )}`;
            const file = join(output_dir, filename);
            const dir = dirname(file);
            const { mtime, uid, gid, mode } = entry.header;

            await mkdir(dir, { recursive: true });
            const file_stream = createWriteStream(file);
            await pipeline(entry, file_stream);

            await set_permissions(file, {
              mode,
              mtime,
              uid,
              gid,
            });

            break;
          }

          case 'symlink': {
            if (!is_windows) {
              const filename = clean_path(normalize(entry.header.name));
              /* c8 ignore next 3 */
              const linked_file = entry.header.linkname
                ? normalize(entry.header.linkname)
                : '';

              if (linked_file) {
                const file_path = join(output_dir, filename);
                await mkdir(dirname(file_path), { recursive: true });
                const { mtime, uid, gid, mode } = entry.header;

                await overwrite_symlink_if_exists(linked_file, file_path);

                await set_permissions(file_path, {
                  mode,
                  mtime,
                  uid,
                  gid,
                });
              }
              /* c8 ignore start */
            } else {
              const filename = clean_path(normalize(entry.header.name));
              const content = entry.header.linkname
                ? normalize(entry.header.linkname)
                : '';

              const file = join(output_dir, filename);
              const dir = dirname(file);
              const { mtime, uid, gid, mode } = entry.header;

              await mkdir(dir, { recursive: true });
              await writeFile(file, content);

              await set_permissions(file, {
                mode,
                mtime,
                uid,
                gid,
              });
            }
            /* c8 ignore end */

            break;
          }
        }

        entry.resume();
      }
      await pip;

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;

      return broken_symlinks(filenames, absolute_path_to_clean_entry_with_mode);
    },
  });

  if (broken_symlinks_list.length !== 0) {
    log_broken_symlink(broken_symlinks_list);
  }
};
