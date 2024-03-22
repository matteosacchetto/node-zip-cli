import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ValidationError } from '@/errors/validation-error';
import { valid_tar_file_path } from '@/validation/tar';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('valid_tar_file_path', async (context) => {
    test('valid filename: out.tar (gzip: off)', () => {
      assert.ok(valid_tar_file_path('out.tar', false));
    });

    test('valid file path: ./out.tar (gzip: off)', () => {
      assert.ok(valid_tar_file_path('./out.tar', false));
    });

    test('valid relative file path: ../out.tar (gzip: off)', () => {
      assert.ok(valid_tar_file_path('../out.tar', false));
    });

    test('valid absolute file path: /out.tar (gzip: off)', () => {
      assert.ok(valid_tar_file_path('/out.tar', false));
    });

    test('valid file path multiple extensions: out.test.tar (gzip: off)', () => {
      assert.ok(valid_tar_file_path('out.test.tar', false));
    });

    test('invalid file path: out.tgz (gzip: off)', () => {
      assert.throws(
        () => valid_tar_file_path('out.tgz', false),
        ValidationError
      );
    });

    test('invalid file path: out (gzip: off)', () => {
      assert.throws(() => valid_tar_file_path('out', false), ValidationError);
    });

    test('invalid file path: out.taru (gzip: off)', () => {
      assert.throws(
        () => valid_tar_file_path('out.taru', false),
        ValidationError
      );
    });

    test('valid filename: out.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('out.tgz', true));
    });

    test('valid filename: out.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('out.tgz', 0));
    });

    test('valid filename: out.tar.gz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('out.tar.gz', true));
    });

    test('valid file path: ./out.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('./out.tgz', true));
    });

    test('valid relative file path: ../out.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('../out.tgz', true));
    });

    test('valid absolute file path: /out.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('/out.tgz', true));
    });

    test('valid file path multiple extensions: out.test.tgz (gzip: on)', () => {
      assert.ok(valid_tar_file_path('out.test.tgz', true));
    });

    test('invalid file path: out.tar (gzip: on)', () => {
      assert.throws(
        () => valid_tar_file_path('out.tar', true),
        ValidationError
      );
    });

    test('invalid file path: out (gzip: on)', () => {
      assert.throws(() => valid_tar_file_path('out', true), ValidationError);
    });

    test('invalid file path: out.tgzu (gzip: on)', () => {
      assert.throws(
        () => valid_tar_file_path('out.taru', true),
        ValidationError
      );
    });
  });
});
