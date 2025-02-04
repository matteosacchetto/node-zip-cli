import assert from 'node:assert';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { BrokenSymlink } from '@/types/fs';
import { log_broken_symlink } from '@/utils/broken-symlink';
import logSymbols from '@/utils/log-symbols';
import chalk from 'chalk';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('conflicts', async () => {
    beforeEach(() => {
      mock.method(process.stderr, 'write', (msg: string, err: () => void) => {
        return msg;
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('no files', async (context) => {
      const broken_symlinks_list: BrokenSymlink[] = [];

      log_broken_symlink(broken_symlinks_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 0);
    });

    test('1 file', async (context) => {
      const broken_symlinks_list: BrokenSymlink[] = [
        {
          cleaned_path: 'test/index.ts',
          link_name: '../index.ts',
        },
      ];

      log_broken_symlink(broken_symlinks_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 3);
      if (process.stderr.isTTY) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `  ${chalk.yellow(logSymbols.warning)} 1 broken symlink\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of symlinks point to entries not contained in the archive\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `${chalk.cyan(broken_symlinks_list[0].cleaned_path)} -> ${chalk.red(
            broken_symlinks_list[0].link_name
          )}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `${logSymbols.warning} 1 broken symlink\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of symlinks point to entries not contained in the archive\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `  ${broken_symlinks_list[0].cleaned_path} -> ${broken_symlinks_list[0].link_name}\n`
        );
      }
    });

    test('2 files', async (context) => {
      const broken_symlinks_list: BrokenSymlink[] = [
        {
          cleaned_path: 'test/index.ts',
          link_name: '../index.ts',
        },
        {
          cleaned_path: 'test/log.ts',
          link_name: '../log.ts',
        },
      ];

      log_broken_symlink(broken_symlinks_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 4);
      if (process.stderr.isTTY) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `  ${chalk.yellow(logSymbols.warning)} 2 broken symlinks\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of symlinks point to entries not contained in the archive\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `${chalk.yellow(
            broken_symlinks_list[0].cleaned_path
          )} -> ${chalk.green(broken_symlinks_list[0].link_name)}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[3].result,
          `${chalk.yellow(
            broken_symlinks_list[1].cleaned_path
          )} -> ${chalk.green(broken_symlinks_list[1].link_name)}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `${logSymbols.warning} 2 broken symlinks\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of symlinks point to entries not contained in the archive\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `  ${broken_symlinks_list[0].cleaned_path} -> ${broken_symlinks_list[0].link_name}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[3].result,
          `  ${broken_symlinks_list[1].cleaned_path} -> ${broken_symlinks_list[1].link_name}\n`
        );
      }
    });
  });
});
