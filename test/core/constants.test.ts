import assert from 'node:assert';
import { platform } from 'node:os';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_windows, preset_compression_level } from '@/core/constants';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('is_windows', async () => {
    test(
      'windows',
      {
        skip:
          platform() !== 'win32'
            ? 'This test is only valid on Windows'
            : undefined,
      },
      async (context) => {
        assert.strictEqual(is_windows, true);
      }
    );

    test(
      'posix/unix like',
      {
        skip:
          platform() === 'win32'
            ? 'This test is not valid on Windows'
            : undefined,
      },
      async (context) => {
        assert.strictEqual(is_windows, false);
      }
    );
  });

  describe('preset_compression_level', async () => {
    test('default level', async () => {
      // Used to check if this values is changed
      assert.strictEqual(preset_compression_level, 6);
    });
  });
});
