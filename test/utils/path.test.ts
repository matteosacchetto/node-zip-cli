import assert from 'node:assert';
import { join, relative } from 'node:path';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { ArchiveEntry } from '@/types/fs';
import { map_absolute_path_to_clean_entry_with_mode } from '@/utils/fs';
import { clean_base_dir, printfile_list_as_file_tree } from '@/utils/path';
import chalk from 'chalk';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

before(() => {
  chalk.level = 0; // Suppress chalk color
});

describe(filename, async () => {
  describe('clean_base_dir', async () => {
    test('test/utils', async () => {
      assert.strictEqual(clean_base_dir('test/utils'), 'test');
    });

    test('test', async () => {
      assert.strictEqual(clean_base_dir('test'), '.');
    });

    test('.', async () => {
      assert.strictEqual(clean_base_dir('.'), '.');
    });
  });

  describe('printfile_list_as_file_tree', async () => {
    beforeEach(() => {
      mock.method(console, 'log', (...msg: unknown[]) => {
        return msg.map((el) => `${el}`).join('\n');
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('1 file', async (t) => {
      const files = <ArchiveEntry[]>[
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

      const absolute_path_to_clean_entry_with_mode =
        map_absolute_path_to_clean_entry_with_mode(files);

      printfile_list_as_file_tree(
        files,
        absolute_path_to_clean_entry_with_mode,
        false
      );

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 2);
      assert.strictEqual(
        mocked_console.mock.calls[0].result,
        files[0].cleaned_path
      );
      assert.strictEqual(mocked_console.mock.calls[1].result, '\n1 file');
    });

    test('2 files', async (t) => {
      const files = <ArchiveEntry[]>[
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

      const absolute_path_to_clean_entry_with_mode =
        map_absolute_path_to_clean_entry_with_mode(files);

      printfile_list_as_file_tree(
        files,
        absolute_path_to_clean_entry_with_mode,
        false
      );

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 4);
      assert.strictEqual(mocked_console.mock.calls[0].result, './');
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        `├── ${files[0].cleaned_path}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        `└── ${files[1].cleaned_path}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[3].result,
        '\n1 directory, 2 files'
      );
    });

    test('1 directory, 2 files', async (t) => {
      const files = <ArchiveEntry[]>[
        {
          type: 'directory',
          path: 'test',
          cleaned_path: 'test',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'file',
          path: 'test/test.test.ts',
          cleaned_path: 'test/test.test.ts',
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
          path: 'test/test1.test.ts',
          cleaned_path: 'test/test1.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      const absolute_path_to_clean_entry_with_mode =
        map_absolute_path_to_clean_entry_with_mode(files);

      printfile_list_as_file_tree(
        files,
        absolute_path_to_clean_entry_with_mode,
        false
      );

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 4);
      assert.strictEqual(
        mocked_console.mock.calls[0].result,
        `${files[0].cleaned_path}/`
      );
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        `├── ${files[1].cleaned_path.split('/').at(-1)!}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        `└── ${files[2].cleaned_path.split('/').at(-1)!}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[3].result,
        '\n1 directory, 2 files'
      );
    });

    test('2 directory, 2 files', async (t) => {
      const files = <ArchiveEntry[]>[
        {
          type: 'directory',
          path: 'test',
          cleaned_path: 'test',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'file',
          path: 'test/test.test.ts',
          cleaned_path: 'test/test.test.ts',
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
          path: 'test1',
          cleaned_path: 'test1',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: new Date(),
            size: 0,
          },
        },
        {
          type: 'file',
          path: 'test1/test1.test.ts',
          cleaned_path: 'test1/test1.test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: new Date(),
            size: 0,
          },
        },
      ];

      const absolute_path_to_clean_entry_with_mode =
        map_absolute_path_to_clean_entry_with_mode(files);

      printfile_list_as_file_tree(
        files,
        absolute_path_to_clean_entry_with_mode,
        false
      );

      const mocked_console = console.log as ReturnType<
        typeof mock.method<Console, 'log'>
      >;

      assert.strictEqual(mocked_console.mock.calls.length, 6);
      assert.strictEqual(mocked_console.mock.calls[0].result, './');
      assert.strictEqual(
        mocked_console.mock.calls[1].result,
        `├── ${files[0].cleaned_path}/`
      );
      assert.strictEqual(
        mocked_console.mock.calls[2].result,
        `│   └── ${files[1].cleaned_path.split('/').at(-1)!}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[3].result,
        `└── ${files[2].cleaned_path}/`
      );
      assert.strictEqual(
        mocked_console.mock.calls[4].result,
        `    └── ${files[3].cleaned_path.split('/').at(-1)!}`
      );
      assert.strictEqual(
        mocked_console.mock.calls[5].result,
        '\n3 directories, 2 files'
      );
    });
  });
});
