import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defer } from '@/utils/promise';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('defer', async () => {
    test('resolve', async () => {
      const { promise, resolve } = defer<number>();

      resolve(2);
      assert.strictEqual(await promise, 2);
    });

    test('rejects', async () => {
      const { promise, reject } = defer<number>();

      assert.rejects(async () => promise);
      reject();
    });
  });
});
