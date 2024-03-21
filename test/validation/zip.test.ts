import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ValidationError } from '@/errors/validation-error';
import { valid_zip_file_path } from '@/validation/zip';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('valid_zip_file_path', async (context) => {
    test('valid filename: out.zip', () => {
      assert.ok(valid_zip_file_path('out.zip'));
    });

    test('valid file path: ./out.zip', () => {
      assert.ok(valid_zip_file_path('./out.zip'));
    });

    test('valid relative file path: ../out.zip', () => {
      assert.ok(valid_zip_file_path('../out.zip'));
    });

    test('valid absolute file path: /out.zip', () => {
      assert.ok(valid_zip_file_path('/out.zip'));
    });

    test('valid file path multiple extensions: out.test.zip', () => {
      assert.ok(valid_zip_file_path('out.test.zip'));
    });

    test('invalid file path: out', () => {
      assert.throws(() => valid_zip_file_path('out'), ValidationError);
    });

    test('invalid file path: out.zipu', () => {
      assert.throws(() => valid_zip_file_path('out.zipu'), ValidationError);
    });
  });
});
