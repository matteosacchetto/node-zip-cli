import type { FsEntry } from '@/types/fs';
import {
  clean_path,
  fix_mode,
  get_default_mode,
  get_default_stats,
} from '@/utils/fs';
import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('get_default_mode', async (context) => {
    test('file', async (context) => {
      assert.strictEqual(get_default_mode('file'), 0o100664);
    });

    test('directory', async (context) => {
      assert.strictEqual(get_default_mode('directory'), 0o40775);
    });
  });

  describe('fix_mode', async (context) => {
    test('file: 0o100666 windows', async (context) => {
      assert.strictEqual(fix_mode(0o100666, true), 0o100664);
    });

    test('file: 0o100777 windows', async (context) => {
      assert.strictEqual(fix_mode(0o100777, true), 0o100664);
    });

    test('file: 0o100666 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o100666, false), 0o100666);
    });

    test('file: 0o100777 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o100777, false), 0o100777);
    });

    test('directory: 0o40666 windows', async (context) => {
      assert.strictEqual(fix_mode(0o40666, true), 0o40775);
    });

    test('directory: 0o40777 windows', async (context) => {
      assert.strictEqual(fix_mode(0o40777, true), 0o40775);
    });

    test('directory: 0o40666 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o40666, false), 0o40666);
    });

    test('directory: 0o40777 unix/linux', async (context) => {
      assert.strictEqual(fix_mode(0o40777, false), 0o40777);
    });
  });

  describe('get_default_stats', async (context) => {
    test('file', async (context) => {
      const now = new Date();
      assert.deepEqual(get_default_stats('file', now), <
        Omit<FsEntry['stats'], 'size'>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o100664,
        mtime: now,
      });
    });

    test('directory', async (context) => {
      const now = new Date();
      assert.deepEqual(get_default_stats('directory', now), <
        Omit<FsEntry['stats'], 'size'>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o40775,
        mtime: now,
      });
    });
  });

  describe('clean_path', async (context) => {
    test('src', async (context) => {
      assert.strictEqual(clean_path('src'), 'src');
    });

    test('../src', async (context) => {
      assert.strictEqual(clean_path('../src'), 'src');
    });

    test('/src', async (context) => {
      assert.strictEqual(clean_path('/src'), 'src');
    });

    test('../test/src', async (context) => {
      assert.strictEqual(clean_path('../test/src'), 'test/src');
    });

    test('//test/src', async (context) => {
      assert.strictEqual(clean_path('//test/src'), 'test/src');
    });

    test('//test/src', async (context) => {
      assert.strictEqual(clean_path('////test/src'), 'test/src');
    });
  });
});
