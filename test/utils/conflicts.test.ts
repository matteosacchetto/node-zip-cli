import assert from 'node:assert';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import type { ConflictingFsEntry } from '@/types/fs';
import { log_conflicts } from '@/utils/conflicts';
import logSymbols from '@/utils/log-symbols';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('conflicts', async () => {
    beforeEach(() => {
      mock.method(process.stderr, 'write', (msg: string, _err: () => void) => {
        return msg;
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('no files', async () => {
      const conflicting_list: ConflictingFsEntry[] = [];

      log_conflicts(conflicting_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 0);
    });

    test('1 file', async () => {
      const conflicting_list: ConflictingFsEntry[] = [
        {
          conflicting_path: 'test/index.ts',
          conflicting_with_path: 'src/index.ts',
        },
      ];

      log_conflicts(conflicting_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 3);
      if (process.stderr.isTTY) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `  ${chalk.yellow(logSymbols.warning)} 1 conflicting entry\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of entries conflicts with other entries\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `${chalk.yellow(
            conflicting_list[0].conflicting_path
          )} -> ${chalk.green(conflicting_list[0].conflicting_with_path)}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `${logSymbols.warning} 1 conflicting entry\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of entries conflicts with other entries\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `  ${conflicting_list[0].conflicting_path} -> ${conflicting_list[0].conflicting_with_path}\n`
        );
      }
    });

    test('2 files', async () => {
      const conflicting_list: ConflictingFsEntry[] = [
        {
          conflicting_path: 'test/index.ts',
          conflicting_with_path: 'src/index.ts',
        },
        {
          conflicting_path: 'test/log.ts',
          conflicting_with_path: 'src/log.ts',
        },
      ];

      log_conflicts(conflicting_list);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 4);
      if (process.stderr.isTTY) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `  ${chalk.yellow(logSymbols.warning)} 2 conflicting entries\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of entries conflicts with other entries\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `${chalk.yellow(
            conflicting_list[0].conflicting_path
          )} -> ${chalk.green(conflicting_list[0].conflicting_with_path)}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[3].result,
          `${chalk.yellow(
            conflicting_list[1].conflicting_path
          )} -> ${chalk.green(conflicting_list[1].conflicting_with_path)}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `${logSymbols.warning} 2 conflicting entries\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '  The following list of entries conflicts with other entries\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[2].result,
          `  ${conflicting_list[0].conflicting_path} -> ${conflicting_list[0].conflicting_with_path}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[3].result,
          `  ${conflicting_list[1].conflicting_path} -> ${conflicting_list[1].conflicting_with_path}\n`
        );
      }
    });
  });
});
