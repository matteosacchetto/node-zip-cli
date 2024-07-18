import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { basename, dirname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { logger } from '@/logger';
import type { ArchiveEntry, CleanedEntryWithMode, FsEntry } from '@/types/fs';
import { log_broken_symlink } from '@/utils/broken-symlink';
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
import { defer } from '@/utils/promise';
import { spinner_wrapper } from '@/utils/spinner-wrapper';
import { is_symlink } from '@/utils/zip';
import chalk from 'chalk';
import JSZip from 'jszip';
import isValidFilename from 'valid-filename';
import { preset_compression_level } from './constants';

export const create_zip = async (
  output_path: string,
  unique_fs_entries: FsEntry[],
  absolute_path_to_clean_entry_with_mode: Map<string, CleanedEntryWithMode>,
  num_files: number,
  deflate: boolean | number,
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
      const zip = new JSZip();

      let i = 0;
      for (const file of unique_fs_entries) {
        if (file.type === 'file') {
          spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
            `[${file}]`
          )}`;

          zip.file(
            normalize_windows_path(file.cleaned_path, is_windows),
            createReadStream(file.path),
            {
              date: file.stats.mtime,
              unixPermissions: file.stats.mode,
            }
          );
        } else if (file.type === 'directory') {
          zip.file(
            normalize_windows_path(file.cleaned_path, is_windows),
            null,
            {
              date: file.stats.mtime,
              unixPermissions: file.stats.mode,
              dir: true,
            }
          );
        } else if (file.type === 'symlink') {
          spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
            `[${file}]`
          )}`;

          zip.file(
            normalize_windows_path(file.cleaned_path, is_windows),
            normalize_windows_path(file.link_name, is_windows),
            {
              date: file.stats.mtime,
              unixPermissions: file.stats.mode,
            }
          );
        }
      }

      spinner.text = `Creating ${output_path} file (0/${num_files} files)`;

      await mkdir(dirname(output_path), { recursive: true });

      i = 0;
      let lastFile = '';
      const { promise, reject, resolve } = defer<void>();
      zip
        .generateNodeStream(
          {
            type: 'nodebuffer',
            streamFiles: true,
            compression: deflate === false ? 'STORE' : 'DEFLATE',
            compressionOptions: {
              level: deflate === true ? preset_compression_level : +deflate,
            },
            platform: 'UNIX',
          },
          (metadata) => {
            if (
              metadata.currentFile &&
              !metadata.currentFile.endsWith('/') &&
              isValidFilename(basename(metadata.currentFile)) &&
              lastFile !== metadata.currentFile
            ) {
              lastFile = metadata.currentFile;
              i++;
              spinner.text = `Creating ${output_path} file (${i}/${num_files} files) ${chalk.dim(
                `[${metadata.currentFile}]`
              )}`;
            }
          }
        )
        .pipe(createWriteStream(output_path))
        .on('error', (err) => {
          /* c8 ignore next 1 */
          reject(err);
        })
        .on('finish', () => {
          spinner.text = `Created ${output_path} file (${i}/${num_files} files)`;
          resolve();
        });

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
  const zip = new JSZip();

  const archive = await zip.loadAsync(await readFile(input_path));
  const filenames = Object.entries(archive.files);
  const entries: ArchiveEntry[] = [];

  for (const el of filenames) {
    const type = el[1].dir
      ? 'directory'
      : is_symlink(el[1])
        ? 'symlink'
        : 'file';

    if (type === 'file' || type === 'directory' || type === 'symlink') {
      /* c8 ignore next 14 */
      const path = el[1].name.endsWith('/')
        ? el[1].name.slice(0, -1) // Remove trailing slash
        : el[1].name;
      const entry = <ArchiveEntry>{
        path: normalize(path),
        cleaned_path: clean_path(normalize(path)),
        type,
        stats: {
          mtime: el[1].date,
          uid: 1000,
          gid: 1000,
          mode: el[1].unixPermissions ?? get_default_mode(type),
        },
      };

      /* c8 ignore next 5 */
      if (entry.type === 'symlink') {
        const link_path = await el[1].async('string');
        entry.link_path = link_path ? normalize(link_path) : '';
        entry.link_name = link_path ? normalize(link_path) : '';
      }

      entries.push(entry);
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
      const zip = new JSZip();
      const content = await readFile(input_path);
      const archive = await zip.loadAsync(content);

      const filenames = Object.entries(archive.files);
      const num_files = filenames.filter((el) => !el[0].endsWith('/')).length;

      let i = 0;
      for (const el of filenames) {
        const filename = el[0];

        /* c8 ignore next 3 */
        const path = filename.endsWith('/')
          ? filename.slice(0, -1) // Remove trailing slash
          : filename;
        const cleaned_path = clean_path(normalize(path));

        if (!el[1].dir) {
          if (is_symlink(el[1]) && !is_windows) {
            // Symlink
            const tmp_link_path = await el[1].async('string');
            /* c8 ignore next 1 */
            const link_path = tmp_link_path ? normalize(tmp_link_path) : '';

            if (link_path) {
              const file_path = join(output_dir, cleaned_path);
              await mkdir(dirname(file_path), { recursive: true });

              await overwrite_symlink_if_exists(link_path, file_path);

              await set_permissions(file_path, {
                mode: el[1].unixPermissions,
                mtime: el[1].date,
              });
            }
          } else {
            // File
            spinner.text = `Extracting ${input_path} file to ${output_dir} (${++i}/${
              filenames.length
            } files) ${chalk.dim(`[${filename}]`)}`;

            const file_path = join(output_dir, cleaned_path);
            await mkdir(dirname(file_path), { recursive: true });

            const file_stream = el[1].nodeStream('nodebuffer');
            await pipeline(file_stream, createWriteStream(file_path));

            await set_permissions(file_path, {
              mode: el[1].unixPermissions,
              mtime: el[1].date,
            });
          }
        } else {
          const dir_path = join(output_dir, cleaned_path);
          await mkdir(dirname(dir_path), { recursive: true });

          await set_permissions(dir_path, {
            mode: el[1].unixPermissions,
            mtime: el[1].date,
          });
        }
      }

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;

      const [files, absolute_path_to_clean_entry_with_mode] =
        await read_zip(input_path);

      return broken_symlinks(files, absolute_path_to_clean_entry_with_mode);
    },
  });

  if (broken_symlinks_list.length !== 0) {
    log_broken_symlink(broken_symlinks_list);
  }
};
