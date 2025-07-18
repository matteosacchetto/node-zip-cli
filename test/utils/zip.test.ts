import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { preset_compression_level } from '@/core/constants';
import { text } from '@/utils/streams';
import {
  get_compression_level,
  is_symlink,
  open_read_stream,
  open_zip_file,
  read_entries,
} from '@/utils/zip';

const data_dir = join(process.cwd(), 'test', '_data_');
const archives_dir = join(process.cwd(), 'test', '_archives_');

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('is_symlink', async () => {
    test('symlink', async () => {
      const mode = 0o120777;
      assert.ok(is_symlink(mode));
    });

    test('file', async () => {
      const mode = 0o100664;
      assert.ok(!is_symlink(mode));
    });

    test('dir', async () => {
      const mode = 0o40775;
      assert.ok(!is_symlink(mode));
    });
  });

  describe('open_zip_file', async () => {
    test('files-dir.zip', async () => {
      assert.ok(open_zip_file(join(archives_dir, 'files-dir.zip')));
    });

    test('files-dir.tar', async () => {
      assert.rejects(open_zip_file(join(archives_dir, 'files-dir.tar')));
    });
  });

  describe('open_read_stream', async () => {
    test('base.zip', async () => {
      const zip = await open_zip_file(join(data_dir, 'base.zip'));
      for await (const entry of read_entries(zip)) {
        if (entry.fileName.endsWith('/')) {
          continue;
        }

        const read_stream = await open_read_stream(zip, entry);
        const data = await text(read_stream);

        assert.strictEqual(data.length, 6);
      }
    });
  });

  describe('read_entries', async () => {
    test('base.zip', async () => {
      const zip = await open_zip_file(join(data_dir, 'base.zip'));
      let counter = 0;
      for await (const _ of read_entries(zip)) {
        counter++;
      }

      assert.strictEqual(counter, 2);
    });

    test('partial base.zip', async () => {
      const zip = await open_zip_file(join(data_dir, 'base.zip'));
      const entries = read_entries(zip);

      const entry = await entries[Symbol.asyncIterator]().next();
      assert.strictEqual(entry.value!.fileName, 'a.txt');
      await entries[Symbol.asyncIterator]().return(); // zip is now closed

      const entries1 = read_entries(zip);
      assert.rejects(entries1[Symbol.asyncIterator]().next());
    });
  });

  describe('get_compression_level', async () => {
    test('deflate: true', () => {
      assert.strictEqual(get_compression_level(true), preset_compression_level);
    });

    test('deflate: false', () => {
      assert.strictEqual(get_compression_level(false), 0);
    });

    test('deflate: 0', () => {
      assert.strictEqual(get_compression_level(0), 0);
    });

    test('deflate: 1', () => {
      assert.strictEqual(get_compression_level(1), 1);
    });

    test('deflate: 5', () => {
      assert.strictEqual(get_compression_level(5), 5);
    });

    test('deflate: 9', () => {
      assert.strictEqual(get_compression_level(9), 9);
    });
  });
});
