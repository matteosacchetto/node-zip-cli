import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { capitalize, uncapitalize } from '@/utils/string';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('capitalize', async (context) => {
    test('test', async (context) => {
      assert.strictEqual(capitalize('test'), 'Test');
    });

    test('Test', async (context) => {
      assert.strictEqual(capitalize('Test'), 'Test');
    });

    test('TEST', async (context) => {
      assert.strictEqual(capitalize('TEST'), 'TEST');
    });

    test('1 test', async (context) => {
      assert.strictEqual(capitalize('1 test'), '1 test');
    });
  });

  describe('uncapitalize', async (context) => {
    test('test', async (context) => {
      assert.strictEqual(uncapitalize('test'), 'test');
    });

    test('Test', async (context) => {
      assert.strictEqual(uncapitalize('Test'), 'test');
    });

    test('TEST', async (context) => {
      assert.strictEqual(uncapitalize('TEST'), 'tEST');
    });

    test('1 test', async (context) => {
      assert.strictEqual(uncapitalize('1 test'), '1 test');
    });
  });
});
