import assert from 'node:assert';
import { join, relative } from 'node:path';
import { Writable } from 'node:stream';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { logger } from '@/logger';
import logSymbols from '@/utils/log-symbols';
import chalk from 'chalk';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

type InteractiveWritable = Writable & { isTTY?: boolean };

const createInteractiveWritable = (isTTY: boolean) => {
  const iwr: InteractiveWritable = new Writable();
  iwr.isTTY = isTTY;
  return iwr;
};

before(() => {
  chalk.level = 3;
});

describe(filename, async () => {
  describe('TTY', () => {
    beforeEach(() => {
      const stdout = createInteractiveWritable(true);
      const stderr = createInteractiveWritable(true);
      mock.method(stdout, 'write', (msg: string) => msg);
      mock.method(stderr, 'write', (msg: string) => msg);
      mock.getter(process, 'stdout', () => stdout);
      mock.getter(process, 'stderr', () => stderr);
    });

    afterEach(() => {
      mock.restoreAll();
      logger.indent();
    });

    test('inspect', async () => {
      logger.log(1);

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${inspect(1, { colors: true, breakLength: 60 })}\n`
      );
    });

    test('write - (1 line, no indent)', async () => {
      logger.write('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\n'
      );
    });

    test('write - (2 lines, no indent)', async () => {
      logger.write('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.write('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write_error - (1 line, no indent)', async () => {
      logger.write_error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\n'
      );
    });

    test('write_error - (2 lines, no indent)', async () => {
      logger.write_error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write_error - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.write_error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('error - (1 line, no indent)', async () => {
      logger.error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.red(logSymbols.error)} test\n`
      );
    });

    test('error - (2 lines, no indent)', async () => {
      logger.error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.red(logSymbols.error)} test\n  test\n`
      );
    });

    test('error - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.red(logSymbols.error)} test\n    test\n`
      );
    });

    test('log - (1 line, no indent)', async () => {
      logger.log('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  test\n'
      );
    });

    test('log - (2 lines, no indent)', async () => {
      logger.log('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  test\n  test\n'
      );
    });

    test('log - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.log('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '    test\n    test\n'
      );
    });

    test('info - (1 line, no indent)', async () => {
      logger.info('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.cyan(logSymbols.info)} test\n`
      );
    });

    test('info - (2 lines, no indent)', async () => {
      logger.info('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.cyan(logSymbols.info)} test\n  test\n`
      );
    });

    test('info - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.info('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.cyan(logSymbols.info)} test\n    test\n`
      );
    });

    test('warning - (1 line, no indent)', async () => {
      logger.warning('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.yellow(logSymbols.warning)} test\n`
      );
    });

    test('warning - (2 lines, no indent)', async () => {
      logger.warning('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.yellow(logSymbols.warning)} test\n  test\n`
      );
    });

    test('warning - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.warning('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.yellow(logSymbols.warning)} test\n    test\n`
      );
    });

    test('success - (1 line, no indent)', async () => {
      logger.success('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.green(logSymbols.success)} test\n`
      );
    });

    test('success - (2 lines, no indent)', async () => {
      logger.success('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.green(logSymbols.success)} test\n  test\n`
      );
    });

    test('success - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.success('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.green(logSymbols.success)} test\n    test\n`
      );
    });

    test('skip - (1 line, no indent)', async () => {
      logger.skip('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.yellow('↓')} test ${chalk.gray.dim('[SKIPPED]')}\n`
      );
    });

    test('skip - (2 lines, no indent)', async () => {
      logger.skip('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.yellow('↓')} test\n  test ${chalk.gray.dim('[SKIPPED]')}\n`
      );
    });

    test('skip - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.skip('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.yellow('↓')} test\n    test ${chalk.gray.dim('[SKIPPED]')}\n`
      );
    });

    test('dimmed_log - (1 line, no indent)', async () => {
      logger.dimmed_log('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n`
      );
    });

    test('dimmed_log - (2 lines, no indent)', async () => {
      logger.dimmed_log('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n  ${chalk.gray.dim('test')}\n`
      );
    });

    test('dimmed_log - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.dimmed_log('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n    ${chalk.gray.dim('test')}\n`
      );
    });

    test('dimmed_error - (1 line, no indent)', async () => {
      logger.dimmed_error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n`
      );
    });

    test('dimmed_error - (2 lines, no indent)', async () => {
      logger.dimmed_error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n  ${chalk.gray.dim('test')}\n`
      );
    });

    test('dimmed_error - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.dimmed_error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${chalk.gray.dim('>')} ${chalk.gray.dim('test')}\n    ${chalk.gray.dim('test')}\n`
      );
    });
  });

  describe('non-TTY', async () => {
    beforeEach(() => {
      const stdout = createInteractiveWritable(false);
      const stderr = createInteractiveWritable(false);
      mock.method(stdout, 'write', (msg: string) => msg);
      mock.method(stderr, 'write', (msg: string) => msg);
      mock.getter(process, 'stdout', () => stdout);
      mock.getter(process, 'stderr', () => stderr);
    });

    afterEach(() => {
      mock.restoreAll();
      logger.indent();
    });

    test('indentation', async () => {
      assert.strictEqual(logger.indentation, 0);

      logger.indentation = 2;
      assert.strictEqual(logger.indentation, 2);

      logger.indentation = 4;
      assert.strictEqual(logger.indentation, 4);

      logger.indent(6);
      assert.strictEqual(logger.indentation, 6);

      logger.indent();
      assert.strictEqual(logger.indentation, 0);
    });

    test('empty - (stdout, no indent)', async () => {
      logger.empty();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        '\n'
      );
    });

    test('empty - (stdout, indent)', async () => {
      logger.indent(2);
      logger.empty();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        '\n'
      );
    });

    test('empty - (stderr, no indent)', async () => {
      logger.empty('stderr');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '\n'
      );
    });

    test('empty - (stderr, indent)', async () => {
      logger.indent(2);
      logger.empty('stderr');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '\n'
      );
    });

    test('inspect', async () => {
      logger.log(1);

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  1\n'
      );
    });

    test('write - (1 line, no indent)', async () => {
      logger.write('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\n'
      );
    });

    test('write - (2 lines, no indent)', async () => {
      logger.write('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.write('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stdout_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write_error - (1 line, no indent)', async () => {
      logger.write_error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\n'
      );
    });

    test('write_error - (2 lines, no indent)', async () => {
      logger.write_error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('write_error - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.write_error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        'test\ntest\n'
      );
    });

    test('error - (1 line, no indent)', async () => {
      logger.error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.error} test\n`
      );
    });

    test('error - (2 lines, no indent)', async () => {
      logger.error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.error} test\n  test\n`
      );
    });

    test('error - (2 lines, indent)', async () => {
      logger.indent(2);
      logger.error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${logSymbols.error} test\n    test\n`
      );
    });

    test('log - (1 line, no indent)', async () => {
      logger.log('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  test\n'
      );
    });

    test('log - (2 lines, no indent)', async () => {
      logger.log('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  test\n  test\n'
      );
    });

    test('log - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.log('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '    test\n    test\n'
      );
    });

    test('info - (1 line, no indent)', async () => {
      logger.info('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.info} test\n`
      );
    });

    test('info - (2 lines, no indent)', async () => {
      logger.info('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.info} test\n  test\n`
      );
    });

    test('info - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.info('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${logSymbols.info} test\n    test\n`
      );
    });

    test('warning - (1 line, no indent)', async () => {
      logger.warning('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.warning} test\n`
      );
    });

    test('warning - (2 lines, no indent)', async () => {
      logger.warning('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.warning} test\n  test\n`
      );
    });

    test('warning - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.warning('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${logSymbols.warning} test\n    test\n`
      );
    });

    test('success - (1 line, no indent)', async () => {
      logger.success('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.success} test\n`
      );
    });

    test('success - (2 lines, no indent)', async () => {
      logger.success('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `${logSymbols.success} test\n  test\n`
      );
    });

    test('success - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.success('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        `  ${logSymbols.success} test\n    test\n`
      );
    });

    test('skip - (1 line, no indent)', async () => {
      logger.skip('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '↓ test [SKIPPED]\n'
      );
    });

    test('skip - (2 lines, no indent)', async () => {
      logger.skip('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '↓ test\n  test [SKIPPED]\n'
      );
    });

    test('skip - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.skip('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  ↓ test\n    test [SKIPPED]\n'
      );
    });

    test('dimmed_log - (1 line, no indent)', async () => {
      logger.dimmed_log('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '> test\n'
      );
    });

    test('dimmed_log - (2 lines, no indent)', async () => {
      logger.dimmed_log('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '> test\n  test\n'
      );
    });

    test('dimmed_log - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.dimmed_log('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  > test\n    test\n'
      );
    });

    test('dimmed_error - (1 line, no indent)', async () => {
      logger.dimmed_error('test');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '> test\n'
      );
    });

    test('dimmed_error - (2 lines, no indent)', async () => {
      logger.dimmed_error('test\ntest');

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '> test\n  test\n'
      );
    });

    test('dimmed_error - (2 lines, with indent)', async () => {
      logger.indent(2);
      logger.dimmed_error('test\ntest');
      logger.indent();

      const mocked_process_stdout_write = process.stdout.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;
      const mocked_process_stderr_write = process.stderr.write as ReturnType<
        typeof mock.method<typeof process.stderr, 'write'>
      >;

      assert.strictEqual(mocked_process_stdout_write.mock.callCount(), 0);
      assert.strictEqual(mocked_process_stderr_write.mock.callCount(), 1);
      assert.strictEqual(
        mocked_process_stderr_write.mock.calls[0].result,
        '  > test\n    test\n'
      );
    });
  });
});
