import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { logger } from '@/logger';
import type { FsEntries } from '@/types/fs';
import { clean_path, get_default_mode } from '@/utils/fs';
import { log_indent } from '@/utils/log';
import { getFilename } from '@/utils/path';
import { defer } from '@/utils/promise';
import { spinner_wrapper } from '@/utils/spinner-wrapper';
import chalk from 'chalk';
import figureSet from 'figures';
import JSZip from 'jszip';
import isValidFilename from 'valid-filename';

export const create_zip = async (
  output_path: string,
  unique_fs_entries: FsEntries[],
  num_files: number,
  deflate: number
) => {
  if (num_files === 0) {
    `${chalk.yellow.bold(
      figureSet.arrowDown
    )} Creating ${output_path} file ${chalk.dim('[SKIPPED]')}`;

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
          },
          (metadata) => {
            if (
              metadata.currentFile &&
              isValidFilename(getFilename(metadata.currentFile)) &&
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

export const read_zip = async (input_path: string) => {
  const zip = new JSZip();

  const archive = await zip.loadAsync(await readFile(input_path));
  const filenames = Object.entries(archive.files);

  return filenames.map(
    (el) =>
      <FsEntries>{
        path: el[1].name,
        cleaned_path: clean_path(el[1].name),
        type: el[1].dir ? 'directory' : 'file',
        stats: {
          mtime: el[1].date,
          uid: 1000,
          gid: 1000,
          mode:
            el[1].unixPermissions ??
            get_default_mode(el[1].dir ? 'directory' : 'file'),
        },
      }
  );
};

export const extract_zip = async (input_path: string, output_dir: string) => {
  await spinner_wrapper({
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
          // File
          spinner.text = `Extracting ${input_path} file to ${output_dir} (${++i}/${
            filenames.length
          } files) ${chalk.dim(`[${filename}]`)}`;

          const file_path = join(output_dir, clean_path(filename));
          await mkdir(dirname(file_path), { recursive: true });

          const file_stream = file.nodeStream('nodebuffer');
          await pipeline(file_stream, createWriteStream(file_path));
        } else {
          const dir_path = join(output_dir, clean_path(filename));
          await mkdir(dirname(dir_path), { recursive: true });
        }
      }

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;
    },
  });
};
