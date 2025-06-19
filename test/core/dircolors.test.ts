import assert from 'node:assert';
import { join, relative } from 'node:path';
import { before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { colorize } from '@/core/dircolors';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

before(() => {
  chalk.level = 3;
});

describe(filename, async () => {
  describe('colorize', async () => {
    test('fifo', async () => {
      assert.strictEqual(
        colorize('fifo', 0o10755, false),
        chalk.bgBlack.yellow('fifo')
      );
    });

    test('chr', async () => {
      assert.strictEqual(
        colorize('chr', 0o20755, false),
        chalk.bold.bgBlack.yellow('chr')
      );
    });

    test('dir: sticky & other_writable', async () => {
      assert.strictEqual(
        colorize('dir: sticky & other_writable', 0o41777, false),
        chalk.bgGreen.black('dir: sticky & other_writable')
      );
    });

    test('dir: sticky', async () => {
      assert.strictEqual(
        colorize('dir: sticky', 0o41775, false),
        chalk.bgBlue.white('dir: sticky')
      );
    });

    test('dir: other_writable', async () => {
      assert.strictEqual(
        colorize('dir: other_writable', 0o40777, false),
        chalk.bgGreen.blue('dir: other_writable')
      );
    });

    test('dir', async () => {
      assert.strictEqual(
        colorize('dir', 0o40775, false),
        chalk.bold.blue('dir')
      );
    });

    test('blk', async () => {
      assert.strictEqual(
        colorize('blk', 0o60664, false),
        chalk.bold.bgBlack.yellow('blk')
      );
    });

    test('file: broken', async () => {
      assert.strictEqual(
        colorize('file: broken', 0o100664, false, true),
        chalk.bold.bgBlack.red('file: broken')
      );
    });

    test('file: exec', async () => {
      assert.strictEqual(
        colorize('file: exec', 0o100777, false),
        chalk.bold.green('file: exec')
      );
    });

    test('file: setgid', async () => {
      assert.strictEqual(
        colorize('file: setgid', 0o102664, false),
        chalk.bgYellow.black('file: setgid')
      );
    });

    test('file: setuid', async () => {
      assert.strictEqual(
        colorize('file: setuid', 0o104664, false),
        chalk.bgRed.white('file: setuid')
      );
    });

    test('file.zip', async () => {
      assert.strictEqual(
        colorize('file.zip', 0o100664, false),
        chalk.bold.red('file.zip')
      );
    });

    test('file.jpg', async () => {
      assert.strictEqual(
        colorize('file.jpg', 0o100664, false),
        chalk.bold.magenta('file.jpg')
      );
    });

    test('file.mp4', async () => {
      assert.strictEqual(
        colorize('file.mp4', 0o100664, false),
        chalk.bold.magenta('file.mp4')
      );
    });

    test('file.wav', async () => {
      assert.strictEqual(
        colorize('file.wav', 0o100664, false),
        chalk.cyan('file.wav')
      );
    });

    test('file.exe', async () => {
      assert.strictEqual(
        colorize('file.exe', 0o100664, true),
        chalk.bold.green('file.exe')
      );
    });

    test('file.ts', async () => {
      assert.strictEqual(
        colorize('file.ts', 0o100664, true),
        chalk.reset('file.ts')
      );
    });

    test('link: broken', async () => {
      assert.strictEqual(
        colorize('link: broken', 0o120664, false, true),
        chalk.bold.bgBlack.red('link: broken')
      );
    });

    test('link', async () => {
      assert.strictEqual(
        colorize('link', 0o120777, false),
        chalk.bold.cyan('link')
      );
    });

    test('sock', async () => {
      assert.strictEqual(
        colorize('sock', 0o140777, false),
        chalk.bold.magenta('sock')
      );
    });

    test('other', async () => {
      assert.strictEqual(
        colorize('other', 0o160777, false),
        chalk.reset('other')
      );
    });
  });
});
