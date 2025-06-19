import assert from 'node:assert';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  scoped_spinner_wrapper,
  spinner_wrapper,
} from '@/utils/spinner-wrapper';
import chalk from 'chalk';
import type { Ora } from 'ora';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('spinner_wrapper', async () => {
    beforeEach(() => {
      mock.method(process.stderr, 'write', (msg: string, _err: () => void) => {
        return msg;
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('success', async () => {
      let _spinner: Ora | undefined ;
      await spinner_wrapper({
        spinner_text: 'init',
        success_text: 'done',
        fail_text: 'fail',
        async fn(spinner) {
          _spinner = spinner;

          assert.strictEqual(spinner.text, 'init');

          return;
        },
      });

      assert.ok(_spinner !== undefined);
      assert.ok((_spinner as Ora).isSpinning === false);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 2);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '- init\n'
      );

      if (chalk.level !== 0) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          `${chalk.green('✔')} done\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '✔ done\n'
        );
      }
    });

    test('fail', async () => {
      let _spinner: Ora | undefined ;
      await assert.rejects(() =>
        spinner_wrapper({
          spinner_text: 'init',
          success_text: 'done',
          fail_text: 'fail',
          async fn(spinner) {
            _spinner = spinner;

            assert.strictEqual(spinner.text, 'init');

            throw new Error('fail');
          },
        })
      );

      assert.ok(_spinner !== undefined);
      assert.ok((_spinner as Ora).isSpinning === false);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 2);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '- init\n'
      );
      if (chalk.level !== 0) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          `${chalk.red('✖')} fail\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '✖ fail\n'
        );
      }
    });
  });

  describe('scoped_spinner_wrapper', async () => {
    beforeEach(() => {
      mock.method(process.stderr, 'write', (...msg: unknown[]) => {
        return msg.map((el) => `${el}`).join('\n');
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    test('success', async () => {
      let _spinner: Ora | undefined ;
      await scoped_spinner_wrapper({
        scope: 'test',
        message: 'success',
        async fn(spinner) {
          _spinner = spinner;

          if (chalk.level !== 0) {
            assert.strictEqual(
              spinner.text,
              `${chalk.bold('test')} ${chalk.dim('success')}`
            );
          } else {
            assert.strictEqual(spinner.text, 'test success');
          }
          return;
        },
      });

      assert.ok(_spinner !== undefined);
      assert.ok((_spinner as Ora).isSpinning === false);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 2);
      if (chalk.level !== 0) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `- ${chalk.bold('test')} ${chalk.dim('success')}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          `${chalk.green('✔')} ${chalk.bold('test')} ${chalk.green(
            'success'
          )}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          '- test success\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '✔ test success\n'
        );
      }
    });

    test('fail', async () => {
      let _spinner: Ora | undefined ;
      await assert.rejects(() =>
        scoped_spinner_wrapper({
          scope: 'test',
          message: 'fail',
          async fn(spinner) {
            _spinner = spinner;

            if (chalk.level !== 0) {
              assert.strictEqual(
                spinner.text,
                `${chalk.bold('test')} ${chalk.dim('fail')}`
              );
            } else {
              assert.strictEqual(spinner.text, 'test fail');
            }

            throw new Error('fail');
          },
        })
      );

      assert.ok(_spinner !== undefined);
      assert.ok((_spinner as Ora).isSpinning === false);

      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.calls.length, 2);
      if (chalk.level !== 0) {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          `- ${chalk.bold('test')} ${chalk.dim('fail')}\n`
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          `${chalk.red('✖')} ${chalk.bold('test')} ${chalk.red('fail')}\n`
        );
      } else {
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[0].result,
          '- test fail\n'
        );
        assert.strictEqual(
          mocked_process_stderr_write.mock.calls[1].result,
          '✖ test fail\n'
        );
      }
    });
  });
});
