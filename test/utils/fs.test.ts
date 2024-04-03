import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { ConflictingFsEntry, FsEntry } from '@/types/fs';
import {
  clean_path,
  fix_mode,
  get_default_mode,
  get_default_stats,
  get_priority_for_type,
  get_symlink_path,
  type_compare,
  unique_entries,
  unique_fs_entries,
} from '@/utils/fs';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('get_priority_for_type', async (context) => {
    test('directory', async () => {
      assert.strictEqual(get_priority_for_type('directory'), 1);
    });

    test('file', async () => {
      assert.strictEqual(get_priority_for_type('file'), 2);
    });

    test('symlink', async () => {
      assert.strictEqual(get_priority_for_type('symlink'), 3);
    });
  });

  describe('type_compare', async (context) => {
    test('directory vs directory', async () => {
      assert.ok(type_compare('directory', 'directory') === 0);
    });

    test('directory vs file', async () => {
      assert.ok(type_compare('directory', 'file') < 0);
    });

    test('directory vs symlink', async () => {
      assert.ok(type_compare('directory', 'symlink') < 0);
    });

    test('file vs directory', async () => {
      assert.ok(type_compare('file', 'directory') > 0);
    });

    test('file vs file', async () => {
      assert.ok(type_compare('file', 'file') === 0);
    });

    test('file vs symlink', async () => {
      assert.ok(type_compare('file', 'symlink') < 0);
    });

    test('symlink vs directory', async () => {
      assert.ok(type_compare('symlink', 'directory') > 0);
    });

    test('symlink vs file', async () => {
      assert.ok(type_compare('symlink', 'file') > 0);
    });

    test('symlink vs symlink', async () => {
      assert.ok(type_compare('symlink', 'symlink') === 0);
    });
  });

  describe('get_default_mode', async (context) => {
    test('file', async (context) => {
      assert.strictEqual(get_default_mode('file'), 0o100664);
    });

    test('directory', async (context) => {
      assert.strictEqual(get_default_mode('directory'), 0o40775);
    });

    test('symlink', async (context) => {
      assert.strictEqual(get_default_mode('symlink'), 0o120777);
    });
  });

  describe('fix_mode', async (context) => {
    test('file: 0o100666 windows', async (context) => {
      assert.strictEqual(fix_mode(0o100666, true), 0o100664);
    });

    test('file: 0o100777 windows', async (context) => {
      assert.strictEqual(fix_mode(0o100777, true), 0o100664);
    });

    test('file: 0o100666 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o100666, false), 0o100666);
    });

    test('file: 0o100777 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o100777, false), 0o100777);
    });

    test('directory: 0o40666 windows', async (context) => {
      assert.strictEqual(fix_mode(0o40666, true), 0o40775);
    });

    test('directory: 0o40777 windows', async (context) => {
      assert.strictEqual(fix_mode(0o40777, true), 0o40775);
    });

    test('directory: 0o40666 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o40666, false), 0o40666);
    });

    test('directory: 0o40777 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o40777, false), 0o40777);
    });

    test('symlink: 0o120666 windows', async (context) => {
      assert.strictEqual(fix_mode(0o120666, true), 0o120777);
    });

    test('symlink: 0o120777 windows', async (context) => {
      assert.strictEqual(fix_mode(0o120777, true), 0o120777);
    });

    test('symlink: 0o120666 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o120666, false), 0o120666);
    });

    test('symlink: 0o120777 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o120777, false), 0o120777);
    });
  });

  describe('get_default_stats', async (context) => {
    test('file', async (context) => {
      const now = new Date();
      assert.deepEqual(get_default_stats('file', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o100664,
        mtime: now,
      });
    });

    test('directory', async (context) => {
      const now = new Date();
      assert.deepEqual(get_default_stats('directory', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o40775,
        mtime: now,
      });
    });

    test('symlink', async (context) => {
      const now = new Date();
      assert.deepEqual(get_default_stats('symlink', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o120777,
        mtime: now,
      });
    });
  });

  describe('clean_path', async (context) => {
    test('src', async (context) => {
      assert.strictEqual(clean_path('src'), 'src');
    });

    test('../src', async (context) => {
      assert.strictEqual(clean_path('../src'), 'src');
    });

    test('/src', async (context) => {
      assert.strictEqual(clean_path('/src'), 'src');
    });

    test('../test/src', async (context) => {
      assert.strictEqual(clean_path('../test/src'), 'test/src');
    });

    test('//test/src', async (context) => {
      assert.strictEqual(clean_path('//test/src'), 'test/src');
    });

    test('//test/src', async (context) => {
      assert.strictEqual(clean_path('////test/src'), 'test/src');
    });
  });

  describe('unique_entries', async () => {
    test('single entry: src', async (context) => {
      assert.deepStrictEqual(unique_entries(['src']), ['src']);
    });

    test('mulitple entry: src, ./src', async (context) => {
      assert.deepStrictEqual(unique_entries(['src', './src']), ['src']);
    });

    test('mulitple entry: src, ./src, join(process.cwd(), src)', async (context) => {
      assert.deepStrictEqual(
        unique_entries(['src', './src', join(process.cwd(), 'src')]),
        ['src']
      );
    });

    test('mulitple entry: src, test', async (context) => {
      assert.deepStrictEqual(unique_entries(['src', 'test']), ['src', 'test']);
    });
  });

  describe('unique_fs_entries', async () => {
    test('no conflict', async () => {
      const now = new Date();
      const entries: FsEntry[] = [
        {
          path: 'src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: 'src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
      ];

      assert.deepStrictEqual(unique_fs_entries(entries), [entries, []]);
    });

    test('conflicts', async () => {
      const now = new Date();
      const entries: FsEntry[] = [
        {
          path: 'src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: 'src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
        {
          path: '../src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: '../src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
      ].sort((a, b) => a.path.localeCompare(b.path)) as FsEntry[];

      assert.deepStrictEqual(unique_fs_entries(entries), [
        [entries[0], entries[2]],
        <ConflictingFsEntry[]>[
          {
            conflicting_path: entries[1].path,
            conflicting_with_path: entries[0].path,
          },
          {
            conflicting_path: entries[3].path,
            conflicting_with_path: entries[2].path,
          },
        ],
      ]);
    });
  });

  describe('get_symlink_path', async (context) => {
    test('relative: ../utils', async () => {
      assert.equal(get_symlink_path('test', '../utils'), '../utils');
    });

    test('relative: utils', async () => {
      assert.equal(get_symlink_path('test', 'utils'), 'utils');
    });

    test('relative: utils', async () => {
      assert.equal(get_symlink_path('test/abc', 'utils'), 'test/utils');
    });

    test('absolute: /utils', async () => {
      assert.equal(get_symlink_path('test/abc', '/utils'), '/utils');
    });
  });
});
