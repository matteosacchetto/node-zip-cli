import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, chown, mkdir, utimes } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';
import type { FsEntries } from '@/types/fs';
import { BooleanFilter } from '@/utils/filter';
import { clean_path, get_default_mode } from '@/utils/fs';
import { spinner_wrapper } from '@/utils/spinner-wrapper';
import { get_full_mode } from '@/utils/tar';
import chalk from 'chalk';
import { extract, pack } from 'tar-stream';

export const create_tar = async (
  output_path: string,
  unique_fs_entries: FsEntries[],
  num_files: number,
  gzip: boolean | number
) => {
  await spinner_wrapper({
    spinner_text: `Reading (0/${num_files} files)`,
    async fn(spinner) {
      const tar = pack();
      tar.once('error', (err) => tar.destroy(err));

      let i = 0;
      for (const fs_entry of unique_fs_entries) {
        if (fs_entry.type === 'directory') {
          tar.entry({
            name: fs_entry.cleaned_path,
            mtime: fs_entry.stats.mtime,
            mode: fs_entry.stats.mode,
            uid: fs_entry.stats.uid,
            gid: fs_entry.stats.gid,
            type: 'directory',
          });
        }
        if (fs_entry.type === 'file') {
          spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
            `[${fs_entry.cleaned_path}]`
          )}`;
          const entry = tar.entry({
            name: fs_entry.cleaned_path,
            size: fs_entry.stats.size,
            mtime: fs_entry.stats.mtime,
            mode: fs_entry.stats.mode,
            uid: fs_entry.stats.uid,
            gid: fs_entry.stats.gid,
            type: 'file',
          });

          const readStream = createReadStream(fs_entry.path);
          entry.once('error', (err) => entry.destroy(err));

          for await (const chunk of readStream) {
            entry.write(chunk);
          }
          entry.end();
        }
      }

      tar.finalize();

      const line = [
        tar,
        gzip !== false
          ? createGzip({
              level: gzip === true ? undefined : gzip,
            })
          : undefined,
        createWriteStream(output_path),
      ].filter(BooleanFilter);

      spinner.text = `Creating ${output_path} file (${num_files}/${num_files} files)`;
      await pipeline(line);
      spinner.text = `Created ${output_path} file (${num_files}/${num_files} files)`;
    },
  });
};

export const read_tar = async (input_path: string) => {
  const ex = extract();

  const line = [
    createReadStream(input_path),
    input_path.endsWith('.tgz') || input_path.endsWith('.tar.gz')
      ? createGunzip()
      : undefined,
    ex,
  ].filter(BooleanFilter);

  const now = new Date();
  const fs_entries: FsEntries[] = [];
  const pip = pipeline(line);
  for await (const entry of ex) {
    if (entry.header.type === 'file' || entry.header.type === 'directory') {
      fs_entries.push({
        path: entry.header.name,
        cleaned_path: clean_path(entry.header.name),
        type: entry.header.type,
        stats: {
          uid: entry.header.uid ?? 1000,
          gid: entry.header.gid ?? 1000,
          mode:
            entry.header.mode === undefined
              ? get_default_mode(entry.header.type)
              : get_full_mode(entry.header.mode, entry.header.type),
          mtime: entry.header.mtime ?? now,
          size: entry.header.size ?? 0,
        },
      });
    }

    entry.resume();
  }
  await pip;

  return fs_entries;
};

export const extract_tar = async (input_path: string, output_dir: string) => {
  await spinner_wrapper({
    spinner_text: `Extracting ${input_path} file to ${output_dir}`,
    async fn(spinner) {
      const num_files = (await read_tar(input_path)).filter(
        (el) => el.type === 'file'
      ).length;

      const ex = extract();

      const line = [
        createReadStream(input_path),
        input_path.endsWith('.tgz') || input_path.endsWith('.tar.gz')
          ? createGunzip()
          : undefined,
        ex,
      ].filter(BooleanFilter);

      const pip = pipeline(line);
      let i = 0;
      for await (const entry of ex) {
        switch (entry.header.type) {
          case 'directory': {
            const dir = join(output_dir, clean_path(entry.header.name));
            const { mtime, uid, gid, mode } = entry.header;
            await mkdir(dir, { recursive: true });

            if (mode) await chmod(dir, mode);
            if (mtime) await utimes(dir, mtime, mtime);
            if (uid && gid) await chown(dir, uid, gid);

            break;
          }

          case 'file': {
            const filename = clean_path(entry.header.name);
            spinner.text = `Extracting ${input_path} file to ${output_dir} (${++i}/${num_files} files) ${chalk.dim(
              `[${filename}]`
            )}`;
            const file = join(output_dir, clean_path(filename));
            const dir = dirname(file);
            const { mtime, uid, gid, mode } = entry.header;

            await mkdir(dir, { recursive: true });
            const filestream = createWriteStream(file);
            await pipeline(entry, filestream);

            if (mode) await chmod(file, mode);
            if (mtime) await utimes(file, mtime, mtime);
            if (uid && gid) await chown(file, uid, gid);

            break;
          }
        }

        entry.resume();
      }
      await pip;

      spinner.text = `Extracted ${input_path} file to ${output_dir} (${num_files}/${num_files} files)`;
    },
  });
};
