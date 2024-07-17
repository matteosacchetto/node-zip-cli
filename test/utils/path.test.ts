import assert from 'node:assert';
import { platform } from 'node:os';
import { join, relative, sep } from 'node:path';
import { before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  clean_base_dir,
  ensure_trailing_separator,
  normalize_entries,
} from '@/utils/path';
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
      assert.strictEqual(clean_base_dir(join('test', 'utils')), 'test');
    });

    test('test', async () => {
      assert.strictEqual(clean_base_dir('test'), '.');
    });

    test('.', async () => {
      assert.strictEqual(clean_base_dir('.'), '.');
    });
  });

  describe('normalize_entries', async () => {
    test(
      'posix/unix',
      {
        skip:
          platform() === 'win32'
            ? 'This test is only for POSIX/Unix platforms'
            : undefined,
      },
      async () => {
        assert.deepStrictEqual(
          normalize_entries(['../src/../test', 'src/test']),
          ['../test', 'src/test']
        );
      }
    );

    test(
      'windows',
      {
        skip:
          platform() !== 'win32' ? 'This test is only for Windows' : undefined,
      },
      async () => {
        assert.deepStrictEqual(
          normalize_entries(['../src/../test', 'src/test']),
          ['..\\test', 'src\\test']
        );
      }
    );
  });

  describe('ensure_trailing_separator', async () => {
    test('file', () => {
      assert.strictEqual(
        ensure_trailing_separator('index.ts', false),
        'index.ts'
      );
    });

    test('dir: no trailing separator', () => {
      assert.strictEqual(ensure_trailing_separator('src', true), `src${sep}`);
    });

    test('dir: no trailing separator', () => {
      assert.strictEqual(
        ensure_trailing_separator(`src${sep}`, true),
        `src${sep}`
      );
    });
  });
});
