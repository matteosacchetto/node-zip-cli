import assert from 'node:assert';
import { lstat, mkdir, rm, writeFile } from 'node:fs/promises';
import { symlink } from 'node:fs/promises';
import { platform } from 'node:os';
import { join, relative, resolve } from 'node:path';
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  mock,
  test,
} from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_windows } from '@/core/constants';
import { create_tar, extract_tar, read_tar } from '@/core/tar';
import { list_entries } from '@/core/walk';
import type { ArchiveEntry, CleanedEntryWithMode } from '@/types/fs';
import { is_gzip_archive } from '@/utils/tar';

const data_dir = join(process.cwd(), 'test', '_data_');
const write_dir = join(process.cwd(), 'test', '_write_');
const archives_dir = join(process.cwd(), 'test', '_archives_');

const format_date = (date: Date) => {
  // In the tar archive the mtime has milliseconds set to 0
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
};

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('read_tar', async () => {
    test('base.tar', async () => {
      const tar_path = join(data_dir, 'base.tar');
      const [entries, map] = await read_tar(
        tar_path,
        await is_gzip_archive(tar_path)
      );

      assert.strictEqual(entries.length, 2);
      assert.deepStrictEqual(entries[0], <ArchiveEntry>{
        path: 'a.txt',
        cleaned_path: 'a.txt',
        type: 'file',
        stats: {
          mtime: entries[0].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.deepStrictEqual(entries[1], <ArchiveEntry>{
        path: 'b.txt',
        cleaned_path: 'b.txt',
        type: 'file',
        stats: {
          mtime: entries[1].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.strictEqual(map.size, 2);
      assert.deepStrictEqual(map.get(resolve(entries[0].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[0].cleaned_path,
        mode: entries[0].stats.mode,
      });
      assert.deepStrictEqual(map.get(resolve(entries[1].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[1].cleaned_path,
        mode: entries[1].stats.mode,
      });
    });

    test('base.tgz', async () => {
      const tar_path = join(data_dir, 'base.tgz');
      const [entries, map] = await read_tar(
        tar_path,
        await is_gzip_archive(tar_path)
      );

      assert.strictEqual(entries.length, 2);
      assert.deepStrictEqual(entries[0], <ArchiveEntry>{
        path: 'a.txt',
        cleaned_path: 'a.txt',
        type: 'file',
        stats: {
          mtime: entries[0].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.deepStrictEqual(entries[1], <ArchiveEntry>{
        path: 'b.txt',
        cleaned_path: 'b.txt',
        type: 'file',
        stats: {
          mtime: entries[1].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.strictEqual(map.size, 2);
      assert.deepStrictEqual(map.get(resolve(entries[0].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[0].cleaned_path,
        mode: entries[0].stats.mode,
      });
      assert.deepStrictEqual(map.get(resolve(entries[1].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[1].cleaned_path,
        mode: entries[1].stats.mode,
      });
    });
  });

  describe('create_tar', async () => {
    const create_tar_dir = join(write_dir, 'create_tar');

    before(async () => {
      await mkdir(create_tar_dir);
      await mkdir(join(create_tar_dir, 'dir-1'));
      await writeFile(join(create_tar_dir, 'dir-1', 'a.txt'), 'a');
      await writeFile(join(create_tar_dir, 'dir-1', 'b.txt'), 'b');
      await mkdir(join(create_tar_dir, 'dir-2'));
      await writeFile(join(create_tar_dir, 'dir-2', 'c.txt'), 'c');
      await writeFile(join(create_tar_dir, 'dir-2', 'd.txt'), 'd');
      await writeFile(join(create_tar_dir, 'e.txt'), 'e');

      if (!is_windows) {
        await symlink('e.txt', join(create_tar_dir, 'symlink-e'));
        await symlink('dir-1', join(create_tar_dir, 'symlink-dir-1'));
      }
    });

    after(async () => {
      await rm(create_tar_dir, { recursive: true });
    });

    beforeEach(async () => {
      mock.method(process.stderr, 'write', (msg: string, _err: () => void) => {
        return msg;
      });
    });

    afterEach(async () => {
      mock.restoreAll();
    });

    test('0 files', async () => {
      await create_tar(
        join(create_tar_dir, 'out-0.tar'),
        [],
        new Map<string, CleanedEntryWithMode>(),
        0,
        false,
        is_windows
      );

      assert.rejects(() => lstat(join(create_tar_dir, 'out-0.tar')));
    });

    test(
      '1 symlink',
      {
        skip:
          platform() === 'win32'
            ? 'Windows does not support symlinks'
            : undefined,
      },
      async () => {
        const [files, conflicting_files, map] = await list_entries(
          [join(create_tar_dir, 'symlink-e')],
          is_windows,
          'none',
          'keep',
          false,
          [],
          'none'
        );

        assert.strictEqual(files.length, 1);
        assert.strictEqual(conflicting_files.length, 0);
        assert.strictEqual(map.size, 1);

        const output_path = join(create_tar_dir, 'out-1.zip');
        await create_tar(output_path, files, map, 1, false, is_windows);

        const [entries] = await read_tar(output_path, false);

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].path, 'symlink-e');
        assert.strictEqual(entries[0].cleaned_path, 'symlink-e');
        assert.strictEqual(entries[0].type, 'symlink');
        assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
        assert.strictEqual(
          entries[0].stats.mtime.getTime(),
          format_date(files[0].stats.mtime).getTime()
        );
      }
    );

    test('1 file', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'e.txt')],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 1);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 1);

      const output_path = join(create_tar_dir, 'out-2.tar');
      await create_tar(output_path, files, map, 1, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].path, 'e.txt');
      assert.strictEqual(entries[0].cleaned_path, 'e.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );
    });

    test('2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1')],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 2);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 2);

      const output_path = join(create_tar_dir, 'out-3.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 2);

      assert.strictEqual(entries[0].path, 'a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, 'b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );
    });

    test('1 directory, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1')],
        is_windows,
        'last',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_tar_dir, 'out-4.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('2 directories, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1'), join(create_tar_dir, 'dir-2')],
        is_windows,
        'last',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 6);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 6);

      const output_path = join(create_tar_dir, 'out-5.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );

      assert.strictEqual(entries[3].path, 'dir-2');
      assert.strictEqual(entries[3].cleaned_path, 'dir-2');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[3].stats.mode);
      assert.strictEqual(
        entries[3].stats.mtime.getTime(),
        format_date(files[3].stats.mtime).getTime()
      );

      assert.strictEqual(entries[4].path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[4].stats.mode);
      assert.strictEqual(
        entries[4].stats.mtime.getTime(),
        format_date(files[4].stats.mtime).getTime()
      );

      assert.strictEqual(entries[5].path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[5].stats.mode);
      assert.strictEqual(
        entries[5].stats.mtime.getTime(),
        format_date(files[5].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3 + 3);

      const output_path = join(create_tar_dir, 'out-6.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files: gzip 9', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3 + 3);

      const output_path = join(create_tar_dir, 'out-7.tgz');
      await create_tar(output_path, files, map, 2, 9, is_windows);

      const [entries] = await read_tar(output_path, true);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files: gzip true', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3 + 3);

      const output_path = join(create_tar_dir, 'out-8.tgz');
      await create_tar(output_path, files, map, 2, true, is_windows);

      const [entries] = await read_tar(output_path, true);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });
  });

  describe('extract_tar', async () => {
    const extract_tar_dir = join(write_dir, 'extract_tar');

    before(async () => {
      await mkdir(extract_tar_dir, { recursive: true });
    });

    after(async () => {
      await rm(extract_tar_dir, { recursive: true });
    });

    beforeEach(async () => {
      mock.method(process.stderr, 'write', (msg: string, _err: () => void) => {
        return msg;
      });
    });

    afterEach(async () => {
      mock.restoreAll();
    });

    test('files-dir.tar', async () => {
      const archive = join(archives_dir, 'files-dir.tar');
      const output_dir = join(extract_tar_dir, 'files-dir-tar');

      await extract_tar(archive, output_dir, false, is_windows);

      const [files] = await list_entries(
        [output_dir],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 7);

      assert.strictEqual(files[0].path, join(output_dir, 'dir-1'));
      assert.strictEqual(files[0].cleaned_path, 'dir-1');
      assert.strictEqual(files[0].type, 'directory');

      assert.strictEqual(files[1].path, join(output_dir, 'dir-1', 'a.txt'));
      assert.strictEqual(files[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(files[1].type, 'file');

      assert.strictEqual(files[2].path, join(output_dir, 'dir-1', 'b.txt'));
      assert.strictEqual(files[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(files[2].type, 'file');

      assert.strictEqual(files[3].path, join(output_dir, 'dir-2'));
      assert.strictEqual(files[3].cleaned_path, 'dir-2');
      assert.strictEqual(files[3].type, 'directory');

      assert.strictEqual(files[4].path, join(output_dir, 'dir-2', 'c.txt'));
      assert.strictEqual(files[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(files[4].type, 'file');

      assert.strictEqual(files[5].path, join(output_dir, 'dir-2', 'd.txt'));
      assert.strictEqual(files[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(files[5].type, 'file');

      assert.strictEqual(files[6].path, join(output_dir, 'empty'));
      assert.strictEqual(files[6].cleaned_path, 'empty');
      assert.strictEqual(files[6].type, 'file');
    });

    test('files-dir.tgz', async () => {
      const archive = join(archives_dir, 'files-dir.tgz');
      const output_dir = join(extract_tar_dir, 'files-dir-tgz');

      await extract_tar(archive, output_dir, true, is_windows);

      const [files] = await list_entries(
        [output_dir],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 7);

      assert.strictEqual(files[0].path, join(output_dir, 'dir-1'));
      assert.strictEqual(files[0].cleaned_path, 'dir-1');
      assert.strictEqual(files[0].type, 'directory');

      assert.strictEqual(files[1].path, join(output_dir, 'dir-1', 'a.txt'));
      assert.strictEqual(files[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(files[1].type, 'file');

      assert.strictEqual(files[2].path, join(output_dir, 'dir-1', 'b.txt'));
      assert.strictEqual(files[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(files[2].type, 'file');

      assert.strictEqual(files[3].path, join(output_dir, 'dir-2'));
      assert.strictEqual(files[3].cleaned_path, 'dir-2');
      assert.strictEqual(files[3].type, 'directory');

      assert.strictEqual(files[4].path, join(output_dir, 'dir-2', 'c.txt'));
      assert.strictEqual(files[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(files[4].type, 'file');

      assert.strictEqual(files[5].path, join(output_dir, 'dir-2', 'd.txt'));
      assert.strictEqual(files[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(files[5].type, 'file');

      assert.strictEqual(files[6].path, join(output_dir, 'empty'));
      assert.strictEqual(files[6].cleaned_path, 'empty');
      assert.strictEqual(files[6].type, 'file');
    });

    test('files-dir-sym.tar', async () => {
      const archive = join(archives_dir, 'files-dir-sym.tar');
      const output_dir = join(extract_tar_dir, 'files-dir-sym-tar');

      await extract_tar(archive, output_dir, false, is_windows);

      const [files] = await list_entries(
        [output_dir],
        is_windows,
        'none',
        'keep',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, is_windows ? 11 : 10);

      assert.strictEqual(files[0].path, join(output_dir, 'dir-1'));
      assert.strictEqual(files[0].cleaned_path, 'dir-1');
      assert.strictEqual(files[0].type, 'directory');

      assert.strictEqual(files[1].path, join(output_dir, 'dir-1', 'a.txt'));
      assert.strictEqual(files[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(files[1].type, 'file');

      assert.strictEqual(files[2].path, join(output_dir, 'dir-1', 'b.txt'));
      assert.strictEqual(files[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(files[2].type, 'file');

      assert.strictEqual(files[3].path, join(output_dir, 'dir-2'));
      assert.strictEqual(files[3].cleaned_path, 'dir-2');
      assert.strictEqual(files[3].type, 'directory');

      assert.strictEqual(files[4].path, join(output_dir, 'dir-2', 'c.txt'));
      assert.strictEqual(files[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(files[4].type, 'file');

      assert.strictEqual(files[5].path, join(output_dir, 'dir-2', 'd.txt'));
      assert.strictEqual(files[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(files[5].type, 'file');

      assert.strictEqual(files[6].path, join(output_dir, 'dir-5'));
      assert.strictEqual(files[6].cleaned_path, 'dir-5');
      assert.strictEqual(files[6].type, 'directory');

      assert.strictEqual(files[7].path, join(output_dir, 'dir-5', 'symlink-a'));
      assert.strictEqual(files[7].cleaned_path, join('dir-5', 'symlink-a'));
      assert.strictEqual(files[7].type, is_windows ? 'file' : 'symlink');

      assert.strictEqual(
        files[8].path,
        join(output_dir, 'dir-5', 'symlink-dir-2')
      );
      assert.strictEqual(files[8].cleaned_path, join('dir-5', 'symlink-dir-2'));
      assert.strictEqual(files[8].type, is_windows ? 'file' : 'symlink');

      if (is_windows) {
        assert.strictEqual(
          files[9].path,
          join(output_dir, 'dir-5', 'symlink-dir-6')
        );
        assert.strictEqual(
          files[9].cleaned_path,
          join('dir-5', 'symlink-dir-6')
        );
        assert.strictEqual(files[9].type, 'file');

        assert.strictEqual(files[10].path, join(output_dir, 'empty'));
        assert.strictEqual(files[10].cleaned_path, 'empty');
        assert.strictEqual(files[10].type, 'file');
      } else {
        assert.strictEqual(files[9].path, join(output_dir, 'empty'));
        assert.strictEqual(files[9].cleaned_path, 'empty');
        assert.strictEqual(files[9].type, 'file');
      }
    });

    test('files-dir-sym.tgz', async () => {
      const archive = join(archives_dir, 'files-dir-sym.tgz');
      const output_dir = join(extract_tar_dir, 'files-dir-sym-tgz');

      await extract_tar(archive, output_dir, true, is_windows);

      const [files] = await list_entries(
        [output_dir],
        is_windows,
        'none',
        'keep',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, is_windows ? 11 : 10);

      assert.strictEqual(files[0].path, join(output_dir, 'dir-1'));
      assert.strictEqual(files[0].cleaned_path, 'dir-1');
      assert.strictEqual(files[0].type, 'directory');

      assert.strictEqual(files[1].path, join(output_dir, 'dir-1', 'a.txt'));
      assert.strictEqual(files[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(files[1].type, 'file');

      assert.strictEqual(files[2].path, join(output_dir, 'dir-1', 'b.txt'));
      assert.strictEqual(files[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(files[2].type, 'file');

      assert.strictEqual(files[3].path, join(output_dir, 'dir-2'));
      assert.strictEqual(files[3].cleaned_path, 'dir-2');
      assert.strictEqual(files[3].type, 'directory');

      assert.strictEqual(files[4].path, join(output_dir, 'dir-2', 'c.txt'));
      assert.strictEqual(files[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(files[4].type, 'file');

      assert.strictEqual(files[5].path, join(output_dir, 'dir-2', 'd.txt'));
      assert.strictEqual(files[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(files[5].type, 'file');

      assert.strictEqual(files[6].path, join(output_dir, 'dir-5'));
      assert.strictEqual(files[6].cleaned_path, 'dir-5');
      assert.strictEqual(files[6].type, 'directory');

      assert.strictEqual(files[7].path, join(output_dir, 'dir-5', 'symlink-a'));
      assert.strictEqual(files[7].cleaned_path, join('dir-5', 'symlink-a'));
      assert.strictEqual(files[7].type, is_windows ? 'file' : 'symlink');

      assert.strictEqual(
        files[8].path,
        join(output_dir, 'dir-5', 'symlink-dir-2')
      );
      assert.strictEqual(files[8].cleaned_path, join('dir-5', 'symlink-dir-2'));
      assert.strictEqual(files[8].type, is_windows ? 'file' : 'symlink');

      if (is_windows) {
        assert.strictEqual(
          files[9].path,
          join(output_dir, 'dir-5', 'symlink-dir-6')
        );
        assert.strictEqual(
          files[9].cleaned_path,
          join('dir-5', 'symlink-dir-6')
        );
        assert.strictEqual(files[9].type, 'file');

        assert.strictEqual(files[10].path, join(output_dir, 'empty'));
        assert.strictEqual(files[10].cleaned_path, 'empty');
        assert.strictEqual(files[10].type, 'file');
      } else {
        assert.strictEqual(files[9].path, join(output_dir, 'empty'));
        assert.strictEqual(files[9].cleaned_path, 'empty');
        assert.strictEqual(files[9].type, 'file');
      }
    });
  });
});
