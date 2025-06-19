import assert from 'node:assert';
import { lstat, mkdir, rm, writeFile } from 'node:fs/promises';
import { EOL, platform } from 'node:os';
import { join, relative, sep } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_windows } from '@/core/constants';
import { list_entries } from '@/core/walk';
import type { ConflictingFsEntry } from '@/types/fs';
import { clean_path, fix_mode } from '@/utils/fs';

const write_dir = join(process.cwd(), 'test', '_write_');

const cwd = process.cwd();

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('list_entries', async () => {
    test("test/_data_/dir-1: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const input = [join('test', '_data_', 'dir-1')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3 + 2); // we also have test and test/_data_

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(input[0], 'b.txt'));
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
      const last_dir = ['dir-1'];
      const input = [join('test', '_data_', last_dir[0])];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, last_dir[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(last_dir[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(last_dir[0], 'b.txt'));
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
      const input = [join('test', '_data_', 'dir-1')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      assert.strictEqual(entries[0].path, join(input[0], 'a.txt'));
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

      assert.strictEqual(entries[1].path, join(input[0], 'b.txt'));
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
      const input = [join(process.cwd(), 'test', '_data_', 'dir-1')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(
        map.size,
        3 + 2 + (process.cwd().split(sep).length - 1)
      );

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, clean_path(input[0]));
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_a = join(input[0], 'a.txt');
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

      const absolute_b = join(input[0], 'b.txt');
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
      const last_dir = ['dir-1'];
      const input = [join(process.cwd(), 'test', '_data_', last_dir[0])];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, last_dir[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_a = join(input[0], 'a.txt');
      assert.strictEqual(entries[1].path, absolute_a);
      assert.strictEqual(entries[1].cleaned_path, join(last_dir[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      const absolute_b = join(input[0], 'b.txt');
      assert.strictEqual(entries[2].path, absolute_b);
      assert.strictEqual(entries[2].cleaned_path, join(last_dir[0], 'b.txt'));
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
      const input = [join(process.cwd(), 'test', '_data_', 'dir-1')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2);

      const absolute_a = join(input[0], 'a.txt');
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

      const absolute_b = join(input[0], 'b.txt');
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
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-2'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, input[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'c.txt'));
      assert.strictEqual(entries[4].cleaned_path, join(input[1], 'c.txt'));
      assert.strictEqual(entries[4].type, 'file');
      const stats_c = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, join(input[1], 'd.txt'));
      assert.strictEqual(entries[5].cleaned_path, join(input[1], 'd.txt'));
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
      const last_dir = ['dir-1', 'dir-2'];
      const input = [
        join('test', '_data_', last_dir[0]),
        join('test', '_data_', last_dir[1]),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, last_dir[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(last_dir[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(last_dir[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, last_dir[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'c.txt'));
      assert.strictEqual(entries[4].cleaned_path, join(last_dir[1], 'c.txt'));
      assert.strictEqual(entries[4].type, 'file');
      const stats_c = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_c.uid,
        gid: stats_c.gid,
        mtime: stats_c.mtime,
        mode: fix_mode(stats_c.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, join(input[1], 'd.txt'));
      assert.strictEqual(entries[5].cleaned_path, join(last_dir[1], 'd.txt'));
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
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-2'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 4);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 4);

      assert.strictEqual(entries[0].path, join(input[0], 'a.txt'));
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

      assert.strictEqual(entries[1].path, join(input[0], 'b.txt'));
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

      assert.strictEqual(entries[2].path, join(input[1], 'c.txt'));
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

      assert.strictEqual(entries[3].path, join(input[1], 'd.txt'));
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
      const input = [
        join('test', '_data_', 'dir-1'),
        join(process.cwd(), 'test', '_data_', 'dir-2'),
      ].sort((a, b) => clean_path(a).localeCompare(clean_path(b)));
      const files = {
        [join('test', '_data_', 'dir-1')]: ['a.txt', 'b.txt'],
        [join(process.cwd(), 'test', '_data_', 'dir-2')]: ['c.txt', 'd.txt'],
      };

      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(
        map.size,
        6 + 2 + (process.cwd().split(sep).length - 1)
      );

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, clean_path(input[0]));
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      const absolute_first = join(input[0], files[input[0]][0]);
      assert.strictEqual(entries[1].path, absolute_first);
      assert.strictEqual(entries[1].cleaned_path, clean_path(absolute_first));
      assert.strictEqual(entries[1].type, 'file');
      const stats_first = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_first.uid,
        gid: stats_first.gid,
        mtime: stats_first.mtime,
        mode: fix_mode(stats_first.mode, is_windows),
        size: 1,
      });

      const absolute_second = join(input[0], files[input[0]][1]);
      assert.strictEqual(entries[2].path, absolute_second);
      assert.strictEqual(entries[2].cleaned_path, clean_path(absolute_second));
      assert.strictEqual(entries[2].type, 'file');
      const stats_second = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_second.uid,
        gid: stats_second.gid,
        mtime: stats_second.mtime,
        mode: fix_mode(stats_second.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, clean_path(input[1]));
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      const absolute_third = join(input[1], files[input[1]][0]);
      assert.strictEqual(entries[4].path, absolute_third);
      assert.strictEqual(entries[4].cleaned_path, clean_path(absolute_third));
      assert.strictEqual(entries[4].type, 'file');
      const stats_third = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_third.uid,
        gid: stats_third.gid,
        mtime: stats_third.mtime,
        mode: fix_mode(stats_third.mode, is_windows),
        size: 1,
      });

      const absolute_fourth = join(input[1], files[input[1]][1]);
      assert.strictEqual(entries[5].path, absolute_fourth);
      assert.strictEqual(entries[5].cleaned_path, clean_path(absolute_fourth));
      assert.strictEqual(entries[5].type, 'file');
      const stats_fourth = await lstat(entries[5].path);
      assert.deepStrictEqual(entries[5].stats, {
        uid: stats_fourth.uid,
        gid: stats_fourth.gid,
        mtime: stats_fourth.mtime,
        mode: fix_mode(stats_fourth.mode, is_windows),
        size: 1,
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-3: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-3'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, input[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'a.txt'));
      assert.strictEqual(entries[4].cleaned_path, join(input[1], 'a.txt'));
      assert.strictEqual(entries[4].type, 'file');
      const stats_a2 = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_a2.uid,
        gid: stats_a2.gid,
        mtime: stats_a2.mtime,
        mode: fix_mode(stats_a2.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, join(input[1], 'c.txt'));
      assert.strictEqual(entries[5].cleaned_path, join(input[1], 'c.txt'));
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
      const last_dir = ['dir-1', 'dir-3'];
      const input = [
        join('test', '_data_', last_dir[0]),
        join('test', '_data_', last_dir[1]),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 6);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 6);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, last_dir[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(last_dir[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(last_dir[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, last_dir[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'a.txt'));
      assert.strictEqual(entries[4].cleaned_path, join(last_dir[1], 'a.txt'));
      assert.strictEqual(entries[4].type, 'file');
      const stats_a2 = await lstat(entries[4].path);
      assert.deepStrictEqual(entries[4].stats, {
        uid: stats_a2.uid,
        gid: stats_a2.gid,
        mtime: stats_a2.mtime,
        mode: fix_mode(stats_a2.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[5].path, join(input[1], 'c.txt'));
      assert.strictEqual(entries[5].cleaned_path, join(last_dir[1], 'c.txt'));
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
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-3'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 1);
      assert.strictEqual(map.size, 3);

      assert.strictEqual(entries[0].path, join(input[0], 'a.txt'));
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

      assert.strictEqual(entries[1].path, join(input[0], 'b.txt'));
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

      assert.strictEqual(entries[2].path, join(input[1], 'c.txt'));
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
        conflicting_path: join(input[1], 'a.txt'),
        conflicting_with_path: join(input[0], 'a.txt'),
      });
    });

    test("test/_data_/dir-1, test/_data_/dir-4: relative {keep_parent: 'full', symlink: 'none'}", async () => {
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-4'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 7);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 7 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, input[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'nested-dir-1'));
      assert.strictEqual(
        entries[4].cleaned_path,
        join(input[1], 'nested-dir-1')
      );
      assert.strictEqual(entries[4].type, 'directory');
      assert.strictEqual(entries[4].n_children, 2);

      assert.strictEqual(
        entries[5].path,
        join(input[1], 'nested-dir-1', 'e.txt')
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        join(input[1], 'nested-dir-1', 'e.txt')
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
        join(input[1], 'nested-dir-1', 'f.txt')
      );
      assert.strictEqual(
        entries[6].cleaned_path,
        join(input[1], 'nested-dir-1', 'f.txt')
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
      const last_dir = ['dir-1', 'dir-4'];
      const input = [
        join('test', '_data_', last_dir[0]),
        join('test', '_data_', last_dir[1]),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 7);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 7);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, last_dir[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 2);

      assert.strictEqual(entries[1].path, join(input[0], 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join(last_dir[0], 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      const stats_a = await lstat(entries[1].path);
      assert.deepStrictEqual(entries[1].stats, {
        uid: stats_a.uid,
        gid: stats_a.gid,
        mtime: stats_a.mtime,
        mode: fix_mode(stats_a.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[2].path, join(input[0], 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join(last_dir[0], 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      const stats_b = await lstat(entries[2].path);
      assert.deepStrictEqual(entries[2].stats, {
        uid: stats_b.uid,
        gid: stats_b.gid,
        mtime: stats_b.mtime,
        mode: fix_mode(stats_b.mode, is_windows),
        size: 1,
      });

      assert.strictEqual(entries[3].path, input[1]);
      assert.strictEqual(entries[3].cleaned_path, last_dir[1]);
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].n_children, 2);

      assert.strictEqual(entries[4].path, join(input[1], 'nested-dir-1'));
      assert.strictEqual(
        entries[4].cleaned_path,
        join(last_dir[1], 'nested-dir-1')
      );
      assert.strictEqual(entries[4].type, 'directory');
      assert.strictEqual(entries[4].n_children, 2);

      assert.strictEqual(
        entries[5].path,
        join(input[1], 'nested-dir-1', 'e.txt')
      );
      assert.strictEqual(
        entries[5].cleaned_path,
        join(last_dir[1], 'nested-dir-1', 'e.txt')
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
        join(input[1], 'nested-dir-1', 'f.txt')
      );
      assert.strictEqual(
        entries[6].cleaned_path,
        join(last_dir[1], 'nested-dir-1', 'f.txt')
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

    test("test/_data_/dir-1, test/_data_/dir-4: relative {keep_parent: 'none', symlink: 'none'}", async () => {
      const input = [
        join('test', '_data_', 'dir-1'),
        join('test', '_data_', 'dir-4'),
      ];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 5);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 5);

      assert.strictEqual(entries[0].path, join(input[0], 'a.txt'));
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

      assert.strictEqual(entries[1].path, join(input[0], 'b.txt'));
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

      assert.strictEqual(entries[2].path, join(input[1], 'nested-dir-1'));
      assert.strictEqual(entries[2].cleaned_path, 'nested-dir-1');
      assert.strictEqual(entries[2].type, 'directory');
      assert.strictEqual(entries[2].n_children, 2);

      assert.strictEqual(
        entries[3].path,
        join(input[1], 'nested-dir-1', 'e.txt')
      );
      assert.strictEqual(
        entries[3].cleaned_path,
        join('nested-dir-1', 'e.txt')
      );
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
        join(input[1], 'nested-dir-1', 'f.txt')
      );
      assert.strictEqual(
        entries[4].cleaned_path,
        join('nested-dir-1', 'f.txt')
      );
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

    test('.', async () => {
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

    test(
      "test/_data_/dir-5: relative {keep_parent: 'full', symlink: 'resolve'}",
      {
        skip:
          platform() === 'win32'
            ? 'Windows does not handle symlinks'
            : undefined,
      },
      async () => {
        const input = [join('test', '_data_', 'dir-5')];
        const [entries, conflicting_list, map] = await list_entries(
          input,
          is_windows,
          'full',
          'resolve',
          false
        );

        assert.strictEqual(entries.length, 5);
        assert.strictEqual(conflicting_list.length, 0);
        assert.strictEqual(map.size, 5 + 2 + 2); // includes test, test/_data_, test/_data_/dir-1 and test/_data_/dir-2

        assert.strictEqual(entries[0].path, input[0]);
        assert.strictEqual(entries[0].cleaned_path, input[0]);
        assert.strictEqual(entries[0].type, 'directory');
        assert.strictEqual(entries[0].n_children, 3);

        assert.strictEqual(
          entries[1].path,
          join(input[0], '..', 'dir-1', 'a.txt')
        );
        assert.strictEqual(
          entries[1].cleaned_path,
          join(input[0], 'symlink-a')
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

        assert.strictEqual(entries[2].path, join(input[0], '..', 'dir-2'));
        assert.strictEqual(
          entries[2].cleaned_path,
          join(input[0], 'symlink-dir-2')
        );
        assert.strictEqual(entries[2].type, 'directory');
        assert.strictEqual(entries[2].n_children, 2);

        assert.strictEqual(
          entries[3].path,
          join(input[0], '..', 'dir-2', 'c.txt')
        );
        assert.strictEqual(
          entries[3].cleaned_path,
          join(input[0], 'symlink-dir-2', 'c.txt')
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

        assert.strictEqual(
          entries[4].path,
          join(input[0], '..', 'dir-2', 'd.txt')
        );
        assert.strictEqual(
          entries[4].cleaned_path,
          join(input[0], 'symlink-dir-2', 'd.txt')
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
      }
    );

    test(
      "test/_data_/dir-5: relative {keep_parent: 'full', symlink: 'keep'}",
      {
        skip:
          platform() === 'win32'
            ? 'Windows does not handle symlinks'
            : undefined,
      },
      async () => {
        const input = [join('test', '_data_', 'dir-5')];
        const [entries, conflicting_list, map] = await list_entries(
          input,
          is_windows,
          'full',
          'keep',
          false
        );

        assert.strictEqual(entries.length, 3);
        assert.strictEqual(conflicting_list.length, 0);
        assert.strictEqual(map.size, 3 + 2);

        assert.strictEqual(entries[0].path, input[0]);
        assert.strictEqual(entries[0].cleaned_path, input[0]);
        assert.strictEqual(entries[0].type, 'directory');
        assert.strictEqual(entries[0].n_children, 2);

        assert.strictEqual(entries[1].path, join(input[0], 'symlink-a'));
        assert.strictEqual(
          entries[1].cleaned_path,
          join(input[0], 'symlink-a')
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
        assert.strictEqual(entries[1].link_path, join('..', 'dir-1', 'a.txt'));
        assert.strictEqual(entries[1].link_name, join('..', 'dir-1', 'a.txt'));

        assert.strictEqual(entries[2].path, join(input[0], 'symlink-dir-2'));
        assert.strictEqual(
          entries[2].cleaned_path,
          join(input[0], 'symlink-dir-2')
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
        assert.strictEqual(entries[2].link_path, join('..', 'dir-2'));
        assert.strictEqual(entries[2].link_name, join('..', 'dir-2'));
      }
    );

    test("test/_data_: relative {keep_parent: 'full', symlink: 'none'} ignore '.zipignore'", async () => {
      const input = [join('test', '_data_')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        ['.zipignore']
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2 + 1);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 1);

      assert.strictEqual(entries[1].path, join(input[0], 'empty'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'empty'));
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

    test("test/_data_: relative {keep_parent: 'full', symlink: 'none'} ignore 'test/_data_/.zipignore'", async () => {
      const input = [join('test', '_data_')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        ['test/_data_/.zipignore']
      );

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 2 + 1);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].n_children, 1);

      assert.strictEqual(entries[1].path, join(input[0], 'empty'));
      assert.strictEqual(entries[1].cleaned_path, join(input[0], 'empty'));
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

    test("test/_data_/empty: relative {keep_parent: 'full', symlink: 'none'} file", async () => {
      const input = [join('test', '_data_', 'empty')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, input[0]);
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

    test("test/_data_/empty: relative {keep_parent: 'last', symlink: 'none'} file", async () => {
      const input = [join('test', '_data_', 'empty')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'last',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1 + 1);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].cleaned_path, join('_data_', 'empty'));
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

    test("test/_data_/empty: relative {keep_parent: 'none', symlink: 'none'} file", async () => {
      const input = [join('test', '_data_', 'empty')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'none',
        'none',
        false
      );

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 1);

      assert.strictEqual(entries[0].path, input[0]);
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

    test("test/_data_/empty: relative {keep_parent: 'full', symlink: 'none'} file then ignored", async () => {
      const input = [join('test', '_data_', 'empty')];
      const [entries, conflicting_list, map] = await list_entries(
        input,
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

    test(
      "test/_data_/dir-1/a.txt, test/_data_/dir-5/symlink-a: relative {keep_parent: 'none', symlink: 'keep'}",
      {
        skip:
          platform() === 'win32'
            ? 'Windows does not handle symlinks'
            : undefined,
      },
      async () => {
        const input = [
          join('test', '_data_', 'dir-1', 'a.txt'),
          join('test', '_data_', 'dir-5', 'symlink-a'),
        ];
        const [entries, conflicting_list, map] = await list_entries(
          input,
          is_windows,
          'none',
          'keep',
          false
        );

        assert.strictEqual(entries.length, 2);
        assert.strictEqual(conflicting_list.length, 0);
        assert.strictEqual(map.size, 2);

        assert.strictEqual(entries[0].path, input[0]);
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

        assert.strictEqual(entries[1].path, input[1]);
        assert.strictEqual(entries[1].cleaned_path, 'symlink-a');
        assert.strictEqual(entries[1].type, 'symlink');
        const stats_symlink_a = await lstat(entries[1].path);
        assert.deepStrictEqual(entries[1].stats, {
          uid: stats_symlink_a.uid,
          gid: stats_symlink_a.gid,
          mtime: stats_symlink_a.mtime,
          mode: fix_mode(stats_symlink_a.mode, is_windows),
          size: stats_symlink_a.size,
        });
        assert.strictEqual(entries[1].link_path, join('..', 'dir-1', 'a.txt'));
        assert.strictEqual(entries[1].link_name, 'a.txt');
      }
    );

    test(
      "test/_case-sensitive_: relative {keep_parent: 'none', symlink: 'none'} ignore 'a.txt'",
      {
        skip:
          platform() === 'linux'
            ? undefined
            : `${platform()} usually has a case-insensitive file system`,
      },
      async () => {
        const input = [join('test', '_case-sensitive_')];
        const [entries, conflicting_list, map] = await list_entries(
          input,
          is_windows,
          'none',
          'none',
          false,
          ['a.txt']
        );

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(conflicting_list.length, 0);
        assert.strictEqual(map.size, 1);

        assert.strictEqual(entries[0].path, join(input[0], 'A.txt'));
        assert.strictEqual(entries[0].cleaned_path, 'A.txt');
        assert.strictEqual(entries[0].type, 'file');
        const stats_a = await lstat(entries[0].path);
        assert.deepStrictEqual(entries[0].stats, {
          uid: stats_a.uid,
          gid: stats_a.gid,
          mtime: stats_a.mtime,
          mode: fix_mode(stats_a.mode, is_windows),
          size: 1,
        });
      }
    );

    test(
      "test/_case-sensitive_: relative {keep_parent: 'none', symlink: 'none'} ignore 'A.txt'",
      {
        skip:
          platform() === 'linux'
            ? undefined
            : `${platform()} usually has a case-insensitive file system`,
      },
      async () => {
        const input = [join('test', '_case-sensitive_')];
        const [entries, conflicting_list, map] = await list_entries(
          input,
          is_windows,
          'none',
          'none',
          false,
          ['A.txt']
        );

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(conflicting_list.length, 0);
        assert.strictEqual(map.size, 1);

        assert.strictEqual(entries[0].path, join(input[0], 'a.txt'));
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
      }
    );
  });

  describe('list_entries: disable ignore rules', async () => {
    const list_entries_dir = join(write_dir, 'list_entries');
    const relative_list_entries_dir = relative(process.cwd(), list_entries_dir);

    before(async () => {
      await mkdir(list_entries_dir);
      await mkdir(join(list_entries_dir, 'dir-1'));
      await writeFile(join(list_entries_dir, 'dir-1', 'a.txt'), 'a');
      await writeFile(join(list_entries_dir, 'dir-1', 'b.txt'), 'b');
      await mkdir(join(list_entries_dir, 'dir-2'));
      await writeFile(join(list_entries_dir, 'dir-2', 'c.txt'), 'c');
      await writeFile(join(list_entries_dir, 'dir-2', 'd.txt'), 'd');
      await writeFile(join(list_entries_dir, 'e.txt'), 'e');

      await writeFile(
        join(list_entries_dir, '.gitignore'),
        `a.txt${EOL}c.txt${EOL}`
      );
      await writeFile(
        join(list_entries_dir, '.zipignore'),
        `b.txt${EOL}d.txt${EOL}`
      );
    });

    after(async () => {
      await rm(list_entries_dir, { recursive: true });
    });

    test('disable rules: none', async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(entries.length, 4);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 4 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[3].type, 'file');
    });

    test("disable rules: none - exclude 'e.txt'", async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        ['e.txt'],
        'none'
      );

      assert.strictEqual(entries.length, 3);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 3 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');
    });

    test('disable rules: zipignore', async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        [],
        'zipignore'
      );

      assert.strictEqual(entries.length, 8);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 8 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'dir-1'));
      assert.strictEqual(entries[3].type, 'directory');

      assert.strictEqual(entries[4].path, join(input[0], 'dir-1', 'b.txt'));
      assert.strictEqual(entries[4].type, 'file');

      assert.strictEqual(entries[5].path, join(input[0], 'dir-2'));
      assert.strictEqual(entries[5].type, 'directory');

      assert.strictEqual(entries[6].path, join(input[0], 'dir-2', 'd.txt'));
      assert.strictEqual(entries[6].type, 'file');

      assert.strictEqual(entries[7].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[7].type, 'file');
    });

    test('disable rules: gitignore', async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        [],
        'gitignore'
      );

      assert.strictEqual(entries.length, 8);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 8 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'dir-1'));
      assert.strictEqual(entries[3].type, 'directory');

      assert.strictEqual(entries[4].path, join(input[0], 'dir-1', 'a.txt'));
      assert.strictEqual(entries[4].type, 'file');

      assert.strictEqual(entries[5].path, join(input[0], 'dir-2'));
      assert.strictEqual(entries[5].type, 'directory');

      assert.strictEqual(entries[6].path, join(input[0], 'dir-2', 'c.txt'));
      assert.strictEqual(entries[6].type, 'file');

      assert.strictEqual(entries[7].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[7].type, 'file');
    });

    test('disable rules: ignore-files', async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        [],
        'ignore-files'
      );

      assert.strictEqual(entries.length, 10);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 10 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'dir-1'));
      assert.strictEqual(entries[3].type, 'directory');

      assert.strictEqual(entries[4].path, join(input[0], 'dir-1', 'a.txt'));
      assert.strictEqual(entries[4].type, 'file');

      assert.strictEqual(entries[5].path, join(input[0], 'dir-1', 'b.txt'));
      assert.strictEqual(entries[5].type, 'file');

      assert.strictEqual(entries[6].path, join(input[0], 'dir-2'));
      assert.strictEqual(entries[6].type, 'directory');

      assert.strictEqual(entries[7].path, join(input[0], 'dir-2', 'c.txt'));
      assert.strictEqual(entries[7].type, 'file');

      assert.strictEqual(entries[8].path, join(input[0], 'dir-2', 'd.txt'));
      assert.strictEqual(entries[8].type, 'file');

      assert.strictEqual(entries[9].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[9].type, 'file');
    });

    test("disable rules: exclude-rules - exclude 'e.txt'", async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        ['e.txt'],
        'exclude-rules'
      );

      assert.strictEqual(entries.length, 4);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 4 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[3].type, 'file');
    });

    test("disable rules: all - exclude 'e.txt'", async () => {
      const input = [relative_list_entries_dir];
      const [entries, conflicting_list, map] = await list_entries(
        input,
        is_windows,
        'full',
        'none',
        false,
        ['e.txt'],
        'all'
      );

      assert.strictEqual(entries.length, 10);
      assert.strictEqual(conflicting_list.length, 0);
      assert.strictEqual(map.size, 10 + 2);

      assert.strictEqual(entries[0].path, input[0]);
      assert.strictEqual(entries[0].type, 'directory');

      assert.strictEqual(entries[1].path, join(input[0], '.gitignore'));
      assert.strictEqual(entries[1].type, 'file');

      assert.strictEqual(entries[2].path, join(input[0], '.zipignore'));
      assert.strictEqual(entries[2].type, 'file');

      assert.strictEqual(entries[3].path, join(input[0], 'dir-1'));
      assert.strictEqual(entries[3].type, 'directory');

      assert.strictEqual(entries[4].path, join(input[0], 'dir-1', 'a.txt'));
      assert.strictEqual(entries[4].type, 'file');

      assert.strictEqual(entries[5].path, join(input[0], 'dir-1', 'b.txt'));
      assert.strictEqual(entries[5].type, 'file');

      assert.strictEqual(entries[6].path, join(input[0], 'dir-2'));
      assert.strictEqual(entries[6].type, 'directory');

      assert.strictEqual(entries[7].path, join(input[0], 'dir-2', 'c.txt'));
      assert.strictEqual(entries[7].type, 'file');

      assert.strictEqual(entries[8].path, join(input[0], 'dir-2', 'd.txt'));
      assert.strictEqual(entries[8].type, 'file');

      assert.strictEqual(entries[9].path, join(input[0], 'e.txt'));
      assert.strictEqual(entries[9].type, 'file');
    });
  });
});
