import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { logger } from '@/logger';
import type { ArchiveEntry, CleanedEntryWithMode, FsEntry } from '@/types/fs';
import { log_broken_symlink } from '@/utils/broken-symlink';
import { date_from_utc, date_to_utc } from '@/utils/date';
import {
  broken_symlinks,
  clean_path,
  get_default_mode,
  map_absolute_path_to_clean_entry_with_mode,
  normalize_windows_path,
  overwrite_symlink_if_exists,
  remove_trailing_sep,
  set_permissions,
} from '@/utils/fs';
import { log_indent } from '@/utils/log';
import { defer } from '@/utils/promise';
import { spinner_wrapper } from '@/utils/spinner-wrapper';
import { text } from '@/utils/streams';
import {
  is_symlink,
  open_read_stream,
  open_zip_file,
  read_entries,
} from '@/utils/zip';
import chalk from 'chalk';
import yazl from 'yazl';

export const create_zip = async (
  output_path: string,
  unique_fs_entries: FsEntry[],
  absolute_path_to_clean_entry_with_mode: Map<string, CleanedEntryWithMode>,
  num_files: number,
  deflate: boolean,
  is_windows: boolean
) => {
  if (num_files === 0) {
    logger.skip(`Creating ${output_path} file`);

    log_indent({
      indentation_increment: 2,
      fn: () => {
        logger.dimmed_error('Nothing to zip');
      },
    });

    return;
  }

  await spinner_wrapper({
    spinner_text: `Reading (0/${num_files} files)`,
    async fn(spinner) {
      const zip = new yazl.ZipFile();

      let read_file_counter = 1,
        write_file_counter = 1;
      for (const file of unique_fs_entries) {
        if (file.type === 'file') {
          spinner.text = `Reading (${read_file_counter++}/${num_files} files) ${chalk.dim(
            `[${file}]`
          )}`;

          const rs = createReadStream(file.path);
          rs.once('resume', () => {
            spinner.text = `Creating ${output_path} file (${write_file_counter}/${num_files} files) ${chalk.dim(
              `[${file.path}]`
            )}`;
          });
          rs.once('end', () => write_file_counter++);
          zip.addReadStream(
            rs,
            normalize_windows_path(file.cleaned_path, is_windows),
            {
              mtime: date_to_utc(file.stats.mtime),
              mode: file.stats.mode,
              compress: deflate,
              size: file.stats.size,
            }
          );
        } else if (file.type === 'directory') {
          zip.addEmptyDirectory(
            normalize_windows_path(file.cleaned_path, is_windows),
            {
              mtime: date_to_utc(file.stats.mtime),
              mode: file.stats.mode,
            }
          );
        } else if (file.type === 'symlink') {
          spinner.text = `Reading (${++read_file_counter}/${num_files} files) ${chalk.dim(
            `[${file}]`
          )}`;

          const rs = new Readable();
          rs.push(normalize_windows_path(file.link_name, is_windows));
          rs.push(null);

          rs.once('resume', () => {
            spinner.text = `Creating ${output_path} file (${write_file_counter}/${num_files} files) ${chalk.dim(
              `[${file.path}]`
            )}`;
          });
          rs.once('end', () => write_file_counter++);

          zip.addReadStream(
            rs,
            normalize_windows_path(file.cleaned_path, is_windows),
            {
              mtime: date_to_utc(file.stats.mtime),
              mode: file.stats.mode,
              compress: deflate,
            }
          );
        }
      }

      spinner.text = `Creating ${output_path} file`;

      await mkdir(dirname(output_path), { recursive: true });

      const { promise, reject, resolve } = defer<void>();
      zip.outputStream
        .pipe(createWriteStream(output_path))
        .on('error', (err) => {
          /* c8 ignore next 1 */
          reject(err);
        })
        .on('close', () => {
          spinner.text = `Created ${output_path} file (${num_files}/${num_files} files)`;
          resolve();
        });

      zip.end();
      return promise;
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

export const read_zip = async (
  input_path: string
): Promise<[ArchiveEntry[], Map<string, CleanedEntryWithMode>]> => {
  const zip = await open_zip_file(input_path);

  const entries: ArchiveEntry[] = [];

  for await (const entry of read_entries(zip)) {
    const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
    const is_dir = entry.fileName.endsWith('/');

    const type = is_dir ? 'directory' : is_symlink(mode) ? 'symlink' : 'file';

    if (type === 'file' || type === 'directory' || type === 'symlink') {
      /* c8 ignore next 14 */
      const path = remove_trailing_sep(entry.fileName, '/');
      const archive_entry = <ArchiveEntry>{
        path: normalize(path),
        cleaned_path: clean_path(normalize(path)),
        type,
        stats: {
          mtime: date_from_utc(entry.getLastModDate()),
          uid: 1000,
          gid: 1000,
          mode: mode || get_default_mode(type),
        },
      };

      /* c8 ignore next 5 */
      if (archive_entry.type === 'symlink') {
        const read_stream = await open_read_stream(zip, entry);
        const link_path = await text(read_stream);

        /* c8 ignore next 2 */
        archive_entry.link_path = link_path ? normalize(link_path) : '';
        archive_entry.link_name = link_path ? normalize(link_path) : '';
      }

      entries.push(archive_entry);
    }
  }

  const absolute_path_to_clean_entry_with_mode =
    map_absolute_path_to_clean_entry_with_mode(entries);

  return [entries, absolute_path_to_clean_entry_with_mode];
};

export const extract_zip = async (
  input_path: string,
  output_dir: string,
  is_windows: boolean
) => {
  const broken_symlinks_list = await spinner_wrapper({
    spinner_text: `Extracting ${input_path} file to ${output_dir}`,
    async fn(spinner) {
      const zip = await open_zip_file(input_path);

      const [files, absolute_path_to_clean_entry_with_mode] =
        await read_zip(input_path);

      const broken_symlinks_list = broken_symlinks(
        files,
        absolute_path_to_clean_entry_with_mode
      );

      const num_files = files.filter((el) => el.type !== 'directory').length;
      let extracted_files_counter = 1;

      for await (const entry of read_entries(zip)) {
        const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
        const is_dir = entry.fileName.endsWith('/');

        const type = is_dir
          ? 'directory'
          : is_symlink(mode)
            ? 'symlink'
            : 'file';

        if (type === 'file' || type === 'directory' || type === 'symlink') {
          const mtime = date_from_utc(entry.getLastModDate());

          /* c8 ignore next 14 */
          const path = remove_trailing_sep(entry.fileName, '/');
          const cleaned_path = clean_path(normalize(path));
          const actual_mode = mode || get_default_mode(type);

          switch (type) {
            case 'directory': {
              const dir_path = join(output_dir, cleaned_path);
              await mkdir(dir_path, { recursive: true });

              await set_permissions(dir_path, {
                mode: actual_mode,
                mtime,
              });
              break;
            }

            case 'file': {
              const file_path = join(output_dir, cleaned_path);

              spinner.text = `Extracting ${input_path} file to ${output_dir} (${extracted_files_counter++}/${
                num_files
              } files) ${chalk.dim(`[${file_path}]`)}`;

              await mkdir(dirname(file_path), { recursive: true });

              const file_stream = await open_read_stream(zip, entry);
              await pipeline(file_stream, createWriteStream(file_path));

              await set_permissions(file_path, {
                mode: actual_mode,
                mtime: mtime,
              });

              break;
            }

            case 'symlink': {
              const read_stream = await open_read_stream(zip, entry);
              let link_path = await text(read_stream);

              /* c8 ignore next 1 */
              link_path = link_path ? normalize(link_path) : '';

              if (link_path) {
                /* c8 ignore next 1 */
                if (is_windows) {
                  /* c8 ignore start */
                  // Treat symlink as a regular file
                  const file_path = join(output_dir, cleaned_path);

                  spinner.text = `Extracting ${input_path} file to ${output_dir} (${extracted_files_counter++}/${
                    num_files
                  } files) ${chalk.dim(`[${file_path}]`)}`;

                  await mkdir(dirname(file_path), { recursive: true });

                  const file_stream = new Readable();
                  file_stream.push(link_path);
                  file_stream.push(null);

                  await pipeline(file_stream, createWriteStream(file_path));

                  await set_permissions(file_path, {
                    mode: actual_mode,
                    mtime: mtime,
                  });
                  /* c8 ignore end */
                } else {
                  const file_path = join(output_dir, cleaned_path);

                  spinner.text = `Extracting ${input_path} file to ${output_dir} (${extracted_files_counter++}/${
                    num_files
                  } files) ${chalk.dim(`[${file_path}]`)}`;

                  await mkdir(dirname(file_path), { recursive: true });

                  await overwrite_symlink_if_exists(link_path, file_path);

                  await set_permissions(file_path, {
                    mode: actual_mode,
                    mtime: mtime,
                  });
                }
              }

              break;
            }
          }
        }
      }

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;

      return broken_symlinks_list;
    },
  });

  if (broken_symlinks_list.length !== 0) {
    log_broken_symlink(broken_symlinks_list);
  }
};
