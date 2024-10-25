import assert from 'node:assert';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { colorize } from '@/core/dircolors';
import { printfile_list_as_find } from '@/core/find';
import type { FsEntry } from '@/types/fs';
import { remove_trailing_sep } from '@/utils/fs';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('printfile_list_as_find', async () => {
    beforeEach(() => {
      mock.method(console, 'log', (...msg: unknown[]) => {
        return msg.map((el) => `${el}`).join('\n');
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('1 file', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 1);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
    });

    test('2 files', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'file',
          path: 'test1.test.ts',
          cleaned_path: 'test1.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 2);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
      assert.strictEqual(mocked_console.mock.calls[1].result, entries[1].path);
    });

    test('1 file, 1 directory (no trailing sep)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test',
          cleaned_path: 'test',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 2);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
      assert.strictEqual(mocked_console.mock.calls[1].result, entries[1].path);
    });

    test('1 file, 1 directory (with trailing sep)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test/',
          cleaned_path: 'test/',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 2);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        remove_trailing_sep(entries[1].path, '/')
      );
    });

    test('1 file, 1 directory (with trailing sep)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test\\',
          cleaned_path: 'test\\',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, true, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 2);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        remove_trailing_sep(entries[1].path, '\\')
      );
    });

    test('1 file, 1 directory (no trailing sep), 1 symlink', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test',
          cleaned_path: 'test',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'symlink',
          path: 'test_link',
          cleaned_path: 'test_link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120777,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, false);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 3);
      assert.strictEqual(mocked_console.mock.calls[0].result, entries[0].path);
      assert.strictEqual(mocked_console.mock.calls[1].result, entries[1].path);
      assert.strictEqual(mocked_console.mock.calls[2].result, entries[2].path);
    });

    test('1 file, 1 directory (no trailing sep), 1 symlink (color)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test',
          cleaned_path: 'test',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'symlink',
          path: 'test_link',
          cleaned_path: 'test_link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120777,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, true);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 3);
      assert.strictEqual(
        mocked_console.mock.calls[0].result,
        colorize(entries[0].path, entries[0].stats.mode, false)
      );
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        colorize(entries[1].path, entries[1].stats.mode, false)
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        colorize(entries[2].path, entries[2].stats.mode, false)
      );
    });

    test('1 file, 1 directory (with trailing sep), 1 symlink (color)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test/',
          cleaned_path: 'test/',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'symlink',
          path: 'test_link',
          cleaned_path: 'test_link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120777,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, false, true);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 3);
      assert.strictEqual(
        mocked_console.mock.calls[0].result,
        colorize(entries[0].path, entries[0].stats.mode, false)
      );
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        colorize(
          remove_trailing_sep(entries[1].path, '/'),
          entries[1].stats.mode,
          false
        )
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        colorize(entries[2].path, entries[2].stats.mode, false)
      );
    });

    test('1 file, 1 directory (with trailing sep), 1 symlink (color)', async (t) => {
      const entries = <FsEntry[]>[
        {
          type: 'file',
          path: 'test.test.ts',
          cleaned_path: 'test.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'directory',
          path: 'test\\',
          cleaned_path: 'test\\',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40755,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'symlink',
          path: 'test_link',
          cleaned_path: 'test_link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120777,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      printfile_list_as_find(entries, true, true);

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 3);
      assert.strictEqual(
        mocked_console.mock.calls[0].result,
        colorize(entries[0].path, entries[0].stats.mode, false)
      );
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        colorize(
          remove_trailing_sep(entries[1].path, '\\'),
          entries[1].stats.mode,
          false
        )
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        colorize(entries[2].path, entries[2].stats.mode, false)
      );
    });
  });
});
