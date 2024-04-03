import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { logger } from '@/logger';
import type { ArchiveEntry, CleanedEntryWithMode, FsEntry } from '@/types/fs';
import { log_broken_symlink } from '@/utils/broken-symlink';
import {
  broken_symlinks,
  clean_path,
  get_default_mode,
  map_absolute_path_to_clean_entry_with_mode,
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

export const create_zip = async (
  output_path: string,
  unique_fs_entries: FsEntry[],
  num_files: number,
  deflate: number
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

          zip.file(file.cleaned_path, createReadStream(file.path), {
            date: file.stats.mtime,
            unixPermissions: file.stats.mode,
          });
        } else if (file.type === 'directory') {
          zip.file(file.cleaned_path, null, {
            date: file.stats.mtime,
            unixPermissions: file.stats.mode,
            dir: true,
          });
        }
        // TODO: add support for symlinks
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
            compression: deflate ? 'DEFLATE' : 'STORE',
            compressionOptions: {
              level: deflate,
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
          reject(err);
        })
        .on('finish', () => {
          spinner.text = `Created ${output_path} file (${i}/${num_files} files)`;
          resolve();
        });

      return promise;
    },
  });
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
      const entry = <ArchiveEntry>{
        path: el[1].name,
        cleaned_path: clean_path(el[1].name),
        type,
        stats: {
          mtime: el[1].date,
          uid: 1000,
          gid: 1000,
          mode: el[1].unixPermissions ?? get_default_mode(type),
        },
      };

      if (entry.type === 'symlink') {
        entry.link_path = await el[1].async('string');
      }

      entries.push(entry);
    }
  }

  const absolute_path_to_clean_entry_with_mode =
    map_absolute_path_to_clean_entry_with_mode(entries);

  return [entries, absolute_path_to_clean_entry_with_mode];
};

export const extract_zip = async (input_path: string, output_dir: string) => {
  const broken_symlinks_list = await spinner_wrapper({
    spinner_text: `Extracting ${input_path} file to ${output_dir}`,
    async fn(spinner) {
      const zip = new JSZip();
      const content = await readFile(input_path);
      const archive = await zip.loadAsync(content);

      const filenames = Object.keys(archive.files);
      const num_files = filenames.filter((el) => !el.endsWith('/')).length;

      let i = 0;
      for (const filename of filenames) {
        const file = archive.file(filename);
        if (!file) {
          continue;
        }

        if (!file.dir) {
          if (is_symlink(file)) {
            // Symlink
            const linked_file = await file.async('string');

            const file_path = join(output_dir, clean_path(filename));
            await mkdir(dirname(file_path), { recursive: true });

            await overwrite_symlink_if_exists(linked_file, file_path);

            await set_permissions(file_path, {
              mode: file.unixPermissions,
              mtime: file.date,
            });
          } else {
            // File
            spinner.text = `Extracting ${input_path} file to ${output_dir} (${++i}/${
              filenames.length
            } files) ${chalk.dim(`[${filename}]`)}`;

            const file_path = join(output_dir, clean_path(filename));
            await mkdir(dirname(file_path), { recursive: true });

            const file_stream = file.nodeStream('nodebuffer');
            await pipeline(file_stream, createWriteStream(file_path));

            await set_permissions(file_path, {
              mode: file.unixPermissions,
              mtime: file.date,
            });
          }
        } else {
          const dir_path = join(output_dir, clean_path(filename));
          await mkdir(dirname(dir_path), { recursive: true });

          await set_permissions(dir_path, {
            mode: file.unixPermissions,
            mtime: file.date,
          });
        }
      }

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;

      const [files, map_absolute_path_to_clean_entry_with_mode] =
        await read_zip(input_path);

      return broken_symlinks(files, map_absolute_path_to_clean_entry_with_mode);
    },
  });

  if (broken_symlinks_list.length !== 0) {
    log_broken_symlink(broken_symlinks_list);
  }
};
