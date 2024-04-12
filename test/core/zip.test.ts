import assert from 'node:assert';
import { lstat, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
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
import { list_entries } from '@/core/walk';
import { create_zip, extract_zip, read_zip } from '@/core/zip';
import type { ArchiveEntry, CleanedEntryWithMode } from '@/types/fs';
import { get_default_mode } from '@/utils/fs';

const data_dir = join(process.cwd(), 'test', '_data_');
const write_dir = join(process.cwd(), 'test', '_write_');
const archives_dir = join(process.cwd(), 'test', '_archives_');

const format_date = (date: Date) => {
  // In the zip archive the mtime has milliseconds set to 0
  // and seconds as a multiple of 2
  //
  // So to be able to compare dates we need to ensure
  // that they are in the same format
  return new Date(Math.floor(date.getTime() / 2000) * 2000);
};

const compare_date = (value: Date, compare_to: Date) => {
  return [
    compare_to.getTime() - 2000,
    compare_to.getTime(),
    compare_to.getTime() + 2000,
  ].includes(value.getTime());
};

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('read_zip', async () => {
    test('base.zip', async (context) => {
      const [entries, map] = await read_zip(join(data_dir, 'base.zip'));

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

  describe('create_zip', async () => {
    const create_zip_dir = join(write_dir, 'create_zip');

    before(async () => {
      await mkdir(create_zip_dir);
      await mkdir(join(create_zip_dir, 'dir-1'));
      await writeFile(join(create_zip_dir, 'dir-1', 'a.txt'), 'a');
      await writeFile(join(create_zip_dir, 'dir-1', 'b.txt'), 'b');
      await mkdir(join(create_zip_dir, 'dir-2'));
      await writeFile(join(create_zip_dir, 'dir-2', 'c.txt'), 'c');
      await writeFile(join(create_zip_dir, 'dir-2', 'd.txt'), 'd');
      await writeFile(join(create_zip_dir, 'e.txt'), 'e');

      if (!is_windows) {
        await symlink('e.txt', join(create_zip_dir, 'symlink-e'));
        await symlink('dir-1', join(create_zip_dir, 'symlink-dir-1'));
      }
    });

    after(async () => {
      await rm(create_zip_dir, { recursive: true });
    });

    beforeEach(async () => {
      mock.method(process.stderr, 'write', (msg: string, err: () => void) => {
        return msg;
      });
    });

    afterEach(async () => {
      mock.restoreAll();
    });

    test('0 files', async () => {
      await create_zip(
        join(create_zip_dir, 'out-0.zip'),
        [],
        new Map<string, CleanedEntryWithMode>(),
        0,
        false,
        is_windows
      );

      assert.rejects(() => lstat(join(create_zip_dir, 'out-0.zip')));
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
          [join(create_zip_dir, 'symlink-e')],
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

        const output_path = join(create_zip_dir, 'out-1.zip');
        await create_zip(output_path, files, map, 1, false, is_windows);

        const [entries] = await read_zip(output_path);

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].path, 'symlink-e');
        assert.strictEqual(entries[0].cleaned_path, 'symlink-e');
        assert.strictEqual(entries[0].type, 'symlink');
        assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
        assert.ok(
          compare_date(
            entries[0].stats.mtime,
            format_date(files[0].stats.mtime)
          )
        );
      }
    );

    test('1 file', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_zip_dir, 'e.txt')],
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

      const output_path = join(create_zip_dir, 'out-2.zip');
      await create_zip(output_path, files, map, 1, false, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].path, 'e.txt');
      assert.strictEqual(entries[0].cleaned_path, 'e.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );
    });

    test('2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_zip_dir, 'dir-1')],
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

      const output_path = join(create_zip_dir, 'out-3.zip');
      await create_zip(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 2);

      assert.strictEqual(entries[0].path, 'a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, 'b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[1].stats.mtime))
      );
    });

    test('1 directory, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_zip_dir, 'dir-1')],
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

      const output_path = join(create_zip_dir, 'out-4.zip');
      await create_zip(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[1].stats.mtime))
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.ok(
        compare_date(entries[2].stats.mtime, format_date(files[2].stats.mtime))
      );
    });

    test('2 directories, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_zip_dir, 'dir-1'), join(create_zip_dir, 'dir-2')],
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

      const output_path = join(create_zip_dir, 'out-5.zip');
      await create_zip(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[1].stats.mtime))
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.ok(
        compare_date(entries[2].stats.mtime, format_date(files[2].stats.mtime))
      );

      assert.strictEqual(entries[3].path, 'dir-2');
      assert.strictEqual(entries[3].cleaned_path, 'dir-2');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[3].stats.mode);
      assert.ok(
        compare_date(entries[3].stats.mtime, format_date(files[3].stats.mtime))
      );

      assert.strictEqual(entries[4].path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[4].stats.mode);
      assert.ok(
        compare_date(entries[4].stats.mtime, format_date(files[4].stats.mtime))
      );

      assert.strictEqual(entries[5].path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[5].stats.mode);
      assert.ok(
        compare_date(entries[5].stats.mtime, format_date(files[5].stats.mtime))
      );
    });

    test('1 directory (with 2 parents), 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_zip_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_zip_dir, 'out-6.zip');
      await create_zip(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'test');
      assert.strictEqual(entries[0].cleaned_path, 'test');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, join('test', '_write_'));
      assert.strictEqual(entries[1].cleaned_path, join('test', '_write_'));
      assert.strictEqual(entries[1].type, 'directory');
      assert.strictEqual(entries[1].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[2].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[3].path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(
        entries[3].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[3].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[4].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[4].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[4].stats.mtime, format_date(files[1].stats.mtime))
      );

      assert.strictEqual(
        entries[5].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[2].stats.mode);
      assert.ok(
        compare_date(entries[5].stats.mtime, format_date(files[2].stats.mtime))
      );
    });

    test('1 directory (with 2 parents), 2 files : deflate 9', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_zip_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_zip_dir, 'out-7.zip');
      await create_zip(output_path, files, map, 2, 9, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'test');
      assert.strictEqual(entries[0].cleaned_path, 'test');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, join('test', '_write_'));
      assert.strictEqual(entries[1].cleaned_path, join('test', '_write_'));
      assert.strictEqual(entries[1].type, 'directory');
      assert.strictEqual(entries[1].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[2].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[3].path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(
        entries[3].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[3].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[4].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[4].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[4].stats.mtime, format_date(files[1].stats.mtime))
      );

      assert.strictEqual(
        entries[5].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[2].stats.mode);
      assert.ok(
        compare_date(entries[5].stats.mtime, format_date(files[2].stats.mtime))
      );
    });

    test('1 directory (with 2 parents), 2 files : deflate true', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_zip_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_zip_dir, 'out-8.zip');
      await create_zip(output_path, files, map, 2, true, is_windows);

      const [entries] = await read_zip(output_path);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'test');
      assert.strictEqual(entries[0].cleaned_path, 'test');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[0].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(entries[1].path, join('test', '_write_'));
      assert.strictEqual(entries[1].cleaned_path, join('test', '_write_'));
      assert.strictEqual(entries[1].type, 'directory');
      assert.strictEqual(entries[1].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[1].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_zip')
      );
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].stats.mode, get_default_mode('directory'));
      assert.ok(
        compare_date(entries[2].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[3].path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(
        entries[3].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1')
      );
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[0].stats.mode);
      assert.ok(
        compare_date(entries[3].stats.mtime, format_date(files[0].stats.mtime))
      );

      assert.strictEqual(
        entries[4].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[4].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[1].stats.mode);
      assert.ok(
        compare_date(entries[4].stats.mtime, format_date(files[1].stats.mtime))
      );

      assert.strictEqual(
        entries[5].path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        join('test', '_write_', 'create_zip', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[2].stats.mode);
      assert.ok(
        compare_date(entries[5].stats.mtime, format_date(files[2].stats.mtime))
      );
    });
  });

  describe('extract_zip', async () => {
    const extract_zip_dir = join(write_dir, 'extract_zip');

    before(async () => {
      await mkdir(extract_zip_dir, { recursive: true });
    });

    after(async () => {
      await rm(extract_zip_dir, { recursive: true });
    });

    beforeEach(async () => {
      mock.method(process.stderr, 'write', (msg: string, err: () => void) => {
        return msg;
      });
    });

    afterEach(async () => {
      mock.restoreAll();
    });

    test('files-dir.zip', async () => {
      const archive = join(archives_dir, 'files-dir.zip');
      const output_dir = join(write_dir, 'files-dir-zip');

      await extract_zip(archive, output_dir, is_windows);

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

    test('files-dir-sym.zip', async () => {
      const archive = join(archives_dir, 'files-dir-sym.zip');
      const output_dir = join(write_dir, 'files-dir-sym-zip');

      await extract_zip(archive, output_dir, is_windows);

      const [files] = await list_entries(
        [output_dir],
        is_windows,
        'none',
        'keep',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 10);

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

      assert.strictEqual(files[9].path, join(output_dir, 'empty'));
      assert.strictEqual(files[9].cleaned_path, 'empty');
      assert.strictEqual(files[9].type, 'file');
    });
  });
});
