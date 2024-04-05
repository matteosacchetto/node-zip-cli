import assert from 'node:assert';
import { lstat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_windows } from '@/core/constants';
import { list_entries } from '@/core/walk';
import type { ConflictingFsEntry } from '@/types/fs';
import { clean_path, fix_mode } from '@/utils/fs';

const cwd = process.cwd();

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('list_entries', async () => {
    test("test/_data_/dir-1: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1: relative {keep_parent: 'last', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1'],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1: relative {keep_parent: 'none', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1'],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      const stats_a = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_b = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1: absolute {keep_parent: 'full', symlink: 'none'}", async () => {
      const absolute_dir1 = join(process.cwd(), 'test/_data_/dir-1');
      const [entries, conflicting_list, map] = await list_entries(
        [absolute_dir1],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, absolute_dir1);
      assert.strictEqual(entries[0].cleaned_path, clean_path(absolute_dir1));
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_a = join(absolute_dir1, 'a.txt');
      assert.strictEqual(entries[1].path, absolute_a);
      assert.strictEqual(entries[1].cleaned_path, clean_path(absolute_a));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      const absolute_b = join(absolute_dir1, 'b.txt');
      assert.strictEqual(entries[2].path, absolute_b);
      assert.strictEqual(entries[2].cleaned_path, clean_path(absolute_b));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1: absolte {keep_parent: 'last', symlink: 'none'}", async () => {
      const absolute_dir1 = join(process.cwd(), 'test/_data_/dir-1');
      const [entries, conflicting_list, map] = await list_entries(
        [absolute_dir1],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, absolute_dir1);
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_a = join(absolute_dir1, 'a.txt');
      assert.strictEqual(entries[1].path, absolute_a);
      assert.strictEqual(entries[1].cleaned_path, 'dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      const absolute_b = join(absolute_dir1, 'b.txt');
      assert.strictEqual(entries[2].path, absolute_b);
      assert.strictEqual(entries[2].cleaned_path, 'dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1: absolte {keep_parent: 'none', symlink: 'none'}", async () => {
      const absolute_dir1 = join(process.cwd(), 'test/_data_/dir-1');
      const [entries, conflicting_list, map] = await list_entries(
        [absolute_dir1],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      const absolute_a = join(absolute_dir1, 'a.txt');
      assert.strictEqual(entries[0].path, absolute_a);
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      const stats_a = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      const absolute_b = join(absolute_dir1, 'b.txt');
      assert.strictEqual(entries[1].path, absolute_b);
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_b = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-2: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-2'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-2');
      assert.strictEqual(entries[3].cleaned_path, 'test/_data_/dir-2');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-2/c.txt');
      assert.strictEqual(entries[4].cleaned_path, 'test/_data_/dir-2/c.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_c = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, 'test/_data_/dir-2/d.txt');
      assert.strictEqual(entries[5].cleaned_path, 'test/_data_/dir-2/d.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_d = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_d.uid,
        gid: stats_d.gid,
        mtime: stats_d.mtime,
        mode: fix_mode(stats_d.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-2: relative {keep_parent: 'last', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-2'],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-2');
      assert.strictEqual(entries[3].cleaned_path, 'dir-2');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-2/c.txt');
      assert.strictEqual(entries[4].cleaned_path, 'dir-2/c.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_c = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, 'test/_data_/dir-2/d.txt');
      assert.strictEqual(entries[5].cleaned_path, 'dir-2/d.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_d = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_d.uid,
        gid: stats_d.gid,
        mtime: stats_d.mtime,
        mode: fix_mode(stats_d.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-2: relative {keep_parent: 'none', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-2'],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 4);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 4);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      const stats_a = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_b = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-2/c.txt');
      assert.strictEqual(entries[2].cleaned_path, 'c.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_c = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-2/d.txt');
      assert.strictEqual(entries[3].cleaned_path, 'd.txt');
      assert.strictEqual(entries[3].type, 'file');
      const stats_d = await lstat(entries[3].path);
      assert.deepStrictEqual(entries[3].stats, {
        uid: stats_d.uid,
        gid: stats_d.gid,
        mtime: stats_d.mtime,
        mode: fix_mode(stats_d.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-2: relative and absolute {keep_parent: 'full', symlink: 'none'}", async () => {
      const absolute_dir2 = join(process.cwd(), 'test/_data_/dir-2');
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', absolute_dir2],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, absolute_dir2);
      assert.strictEqual(entries[0].cleaned_path, clean_path(absolute_dir2));
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_c = join(absolute_dir2, 'c.txt');
      assert.strictEqual(entries[1].path, absolute_c);
      assert.strictEqual(entries[1].cleaned_path, clean_path(absolute_c));
      assert.strictEqual(entries[1].type, 'file');
      const stats_c = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      const absolute_d = join(absolute_dir2, 'd.txt');
      assert.strictEqual(entries[2].path, absolute_d);
      assert.strictEqual(entries[2].cleaned_path, clean_path(absolute_d));
      assert.strictEqual(entries[2].type, 'file');
      const stats_d = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_d.uid,
        gid: stats_d.gid,
        mtime: stats_d.mtime,
        mode: fix_mode(stats_d.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[3].cleaned_path, 'test/_data_/dir-1');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[4].cleaned_path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_a = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[5].cleaned_path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_b = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-3: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-3'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-3');
      assert.strictEqual(entries[3].cleaned_path, 'test/_data_/dir-3');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-3/a.txt');
      assert.strictEqual(entries[4].cleaned_path, 'test/_data_/dir-3/a.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_a2 = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_a2.uid,
        gid: stats_a2.gid,
        mtime: stats_a2.mtime,
        mode: fix_mode(stats_a2.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, 'test/_data_/dir-3/c.txt');
      assert.strictEqual(entries[5].cleaned_path, 'test/_data_/dir-3/c.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_c = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-3: relative {keep_parent: 'last', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-3'],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-3');
      assert.strictEqual(entries[3].cleaned_path, 'dir-3');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-3/a.txt');
      assert.strictEqual(entries[4].cleaned_path, 'dir-3/a.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_a2 = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_a2.uid,
        gid: stats_a2.gid,
        mtime: stats_a2.mtime,
        mode: fix_mode(stats_a2.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, 'test/_data_/dir-3/c.txt');
      assert.strictEqual(entries[5].cleaned_path, 'dir-3/c.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_c = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-3: relative {keep_parent: 'none', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-3'],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 1);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      const stats_a = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_b = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-3/c.txt');
      assert.strictEqual(entries[2].cleaned_path, 'c.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_c = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.deepStrictEqual(conflicting_list[0], <ConflictingFsEntry>{
        conflicting_path: 'test/_data_/dir-3/a.txt',
        conflicting_with_path: 'test/_data_/dir-1/a.txt',
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-4: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-4'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 7);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 7);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-4');
      assert.strictEqual(entries[3].cleaned_path, 'test/_data_/dir-4');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-4/nested-dir-1');
      assert.strictEqual(
        entries[4].cleaned_path,
        'test/_data_/dir-4/nested-dir-1'
      );
      assert.strictEqual(entries[4].type, 'directory');
      assert.strictEqual(entries[4].n_children, 2);

      assert.strictEqual(
        entries[5].path,
        'test/_data_/dir-4/nested-dir-1/e.txt'
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        'test/_data_/dir-4/nested-dir-1/e.txt'
      );
      assert.strictEqual(entries[5].type, 'file');
      const stats_e = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_e.uid,
        gid: stats_e.gid,
        mtime: stats_e.mtime,
        mode: fix_mode(stats_e.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(
        entries[6].path,
        'test/_data_/dir-4/nested-dir-1/f.txt'
      );
      assert.strictEqual(
        entries[6].cleaned_path,
        'test/_data_/dir-4/nested-dir-1/f.txt'
      );
      assert.strictEqual(entries[6].type, 'file');
      const stats_f = await lstat(entries[6].path);
      assert.deepStrictEqual(entries[6].stats, {
        uid: stats_f.uid,
        gid: stats_f.gid,
        mtime: stats_f.mtime,
        mode: fix_mode(stats_f.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-4: relative {keep_parent: 'last', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-4'],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 7);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 7);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[1].cleaned_path, 'dir-1/a.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[2].cleaned_path, 'dir-1/b.txt');
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, 'test/_data_/dir-4');
      assert.strictEqual(entries[3].cleaned_path, 'dir-4');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, 'test/_data_/dir-4/nested-dir-1');
      assert.strictEqual(entries[4].cleaned_path, 'dir-4/nested-dir-1');
      assert.strictEqual(entries[4].type, 'directory');
      assert.strictEqual(entries[4].n_children, 2);

      assert.strictEqual(
        entries[5].path,
        'test/_data_/dir-4/nested-dir-1/e.txt'
      );
      assert.strictEqual(entries[5].cleaned_path, 'dir-4/nested-dir-1/e.txt');
      assert.strictEqual(entries[5].type, 'file');
      const stats_e = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_e.uid,
        gid: stats_e.gid,
        mtime: stats_e.mtime,
        mode: fix_mode(stats_e.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(
        entries[6].path,
        'test/_data_/dir-4/nested-dir-1/f.txt'
      );
      assert.strictEqual(entries[6].cleaned_path, 'dir-4/nested-dir-1/f.txt');
      assert.strictEqual(entries[6].type, 'file');
      const stats_f = await lstat(entries[6].path);
      assert.deepStrictEqual(entries[6].stats, {
        uid: stats_f.uid,
        gid: stats_f.gid,
        mtime: stats_f.mtime,
        mode: fix_mode(stats_f.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-4: relative {keep_parent: 'none', symlink: 'none'}", async () => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-1', 'test/_data_/dir-4'],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 5);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 5);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      const stats_a = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      const stats_b = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-4/nested-dir-1');
      assert.strictEqual(entries[2].cleaned_path, 'nested-dir-1');
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].n_children, 2);

      assert.strictEqual(
        entries[3].path,
        'test/_data_/dir-4/nested-dir-1/e.txt'
      );
      assert.strictEqual(entries[3].cleaned_path, 'nested-dir-1/e.txt');
      assert.strictEqual(entries[3].type, 'file');
      const stats_e = await lstat(entries[3].path);
      assert.deepStrictEqual(entries[3].stats, {
        uid: stats_e.uid,
        gid: stats_e.gid,
        mtime: stats_e.mtime,
        mode: fix_mode(stats_e.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(
        entries[4].path,
        'test/_data_/dir-4/nested-dir-1/f.txt'
      );
      assert.strictEqual(entries[4].cleaned_path, 'nested-dir-1/f.txt');
      assert.strictEqual(entries[4].type, 'file');
      const stats_f = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_f.uid,
        gid: stats_f.gid,
        mtime: stats_f.mtime,
        mode: fix_mode(stats_f.mode, is_windows),
        size: 1,
      });
    });

    test('.', async (ctx) => {
      process.chdir(join(cwd, 'test', '_data_'));

      const [entries, conflicting_list, map] = await list_entries(
        ['.'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      assert.strictEqual(entries[0].path, '.zipignore');
      assert.strictEqual(entries[0].cleaned_path, '.zipignore');
      assert.strictEqual(entries[0].type, 'file');
      const stats_zipignore = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_zipignore.uid,
        gid: stats_zipignore.gid,
        mtime: stats_zipignore.mtime,
        mode: fix_mode(stats_zipignore.mode, is_windows),
        size: stats_zipignore.size,
      });

      assert.strictEqual(entries[1].path, 'empty');
      assert.strictEqual(entries[1].cleaned_path, 'empty');
      assert.strictEqual(entries[1].type, 'file');
      const stats_empty = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });

      process.chdir(cwd);
    });

    test("test/_data_/dir-5: relative {keep_parent: 'full', symlink: 'resolve'}", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-5'],
        is_windows,
        'full',
        'resolve',
        false
      );

      assert.strictEqual(entries.length, 5);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 5);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-5');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-5');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 3);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-1/a.txt');
      assert.strictEqual(
        entries[1].cleaned_path,
        'test/_data_/dir-5/symlink-a'
      );
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, 'test/_data_/dir-2');
      assert.strictEqual(
        entries[2].cleaned_path,
        'test/_data_/dir-5/symlink-dir-2'
      );
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].n_children, 2);

      assert.strictEqual(entries[3].path, 'test/_data_/dir-2/c.txt');
      assert.strictEqual(
        entries[3].cleaned_path,
        'test/_data_/dir-5/symlink-dir-2/c.txt'
      );
      assert.strictEqual(entries[3].type, 'file');
      const stats_c = await lstat(entries[3].path);
      assert.deepStrictEqual(entries[3].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[4].path, 'test/_data_/dir-2/d.txt');
      assert.strictEqual(
        entries[4].cleaned_path,
        'test/_data_/dir-5/symlink-dir-2/d.txt'
      );
      assert.strictEqual(entries[4].type, 'file');
      const stats_d = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_d.uid,
        gid: stats_d.gid,
        mtime: stats_d.mtime,
        mode: fix_mode(stats_d.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-5: relative {keep_parent: 'full', symlink: 'keep'}", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/dir-5'],
        is_windows,
        'full',
        'keep',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, 'test/_data_/dir-5');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/dir-5');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, 'test/_data_/dir-5/symlink-a');
      assert.strictEqual(
        entries[1].cleaned_path,
        'test/_data_/dir-5/symlink-a'
      );
      assert.strictEqual(entries[1].type, 'symlink');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: stats_a.size,
      });
      assert.strictEqual(entries[1].link_path, '../dir-1/a.txt');
      assert.strictEqual(entries[1].link_name, '../dir-1/a.txt');

      assert.strictEqual(entries[2].path, 'test/_data_/dir-5/symlink-dir-2');
      assert.strictEqual(
        entries[2].cleaned_path,
        'test/_data_/dir-5/symlink-dir-2'
      );
      assert.strictEqual(entries[2].type, 'symlink');
      const stats_dir2 = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_dir2.uid,
        gid: stats_dir2.gid,
        mtime: stats_dir2.mtime,
        mode: fix_mode(stats_dir2.mode, is_windows),
        size: stats_dir2.size,
      });
      assert.strictEqual(entries[2].link_path, '../dir-2');
      assert.strictEqual(entries[2].link_name, '../dir-2');
    });

    test("test/_data_: relative {keep_parent: 'full', symlink: 'none'} ignore '.zipignore'", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_'],
        is_windows,
        'full',
        'none',
        false,
        ['.zipignore']
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      assert.strictEqual(entries[0].path, 'test/_data_');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 1);

      assert.strictEqual(entries[1].path, 'test/_data_/empty');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/empty');
      assert.strictEqual(entries[1].type, 'file');
      const stats_empty = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });
    });

    test("test/_data_: relative {keep_parent: 'full', symlink: 'none'} ignore 'test/_data_/.zipignore'", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_'],
        is_windows,
        'full',
        'none',
        false,
        ['test/_data_/.zipignore']
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      assert.strictEqual(entries[0].path, 'test/_data_');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 1);

      assert.strictEqual(entries[1].path, 'test/_data_/empty');
      assert.strictEqual(entries[1].cleaned_path, 'test/_data_/empty');
      assert.strictEqual(entries[1].type, 'file');
      const stats_empty = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });
    });

    test("test/_data_/empty: relative {keep_parent: 'full', symlink: 'none'} file", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/empty'],
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1);

      assert.strictEqual(entries[0].path, 'test/_data_/empty');
      assert.strictEqual(entries[0].cleaned_path, 'test/_data_/empty');
      assert.strictEqual(entries[0].type, 'file');
      const stats_empty = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });
    });

    test("test/_data_/empty: relative {keep_parent: 'last', symlink: 'none'} file", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/empty'],
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1);

      assert.strictEqual(entries[0].path, 'test/_data_/empty');
      assert.strictEqual(entries[0].cleaned_path, '_data_/empty');
      assert.strictEqual(entries[0].type, 'file');
      const stats_empty = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });
    });

    test("test/_data_/empty: relative {keep_parent: 'none', symlink: 'none'} file", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/empty'],
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1);

      assert.strictEqual(entries[0].path, 'test/_data_/empty');
      assert.strictEqual(entries[0].cleaned_path, 'empty');
      assert.strictEqual(entries[0].type, 'file');
      const stats_empty = await lstat(entries[0].path);
      assert.deepStrictEqual(entries[0].stats, {
        uid: stats_empty.uid,
        gid: stats_empty.gid,
        mtime: stats_empty.mtime,
        mode: fix_mode(stats_empty.mode, is_windows),
        size: 0,
      });
    });

    test("test/_data_/empty: relative {keep_parent: 'full', symlink: 'none'} file then ignored", async (ctx) => {
      const [entries, conflicting_list, map] = await list_entries(
        ['test/_data_/empty'],
        is_windows,
        'full',
        'none',
        false,
        ['test/_data_/empty']
      );

      assert.strictEqual(entries.length, 0);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 0);
    });
  });
});
