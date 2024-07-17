import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  create_ignore_filter,
  is_ignored,
  load_ignore_rules,
} from '@/core/ignore';

const ignore_dir = join(process.cwd(), 'test', '_ignore_');

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('load_ignore_rules', async () => {
    test('existing file: ignore-rules', async () => {
      const rules = await load_ignore_rules(join(ignore_dir, 'ignore-rules'));
      assert.deepStrictEqual(rules, [
        '# Comment',
        'src',
        '*.ts',
        '**/*.js',
        '# Comment 2',
        'log.*',
        '# Comment multiline',
        '# Comment multiline 2',
        'dist/',
        'test/**/*',
      ]);
    });
    test('non-existing file: nonexisting-ignore-rules', async () => {
      const rules = await load_ignore_rules(
        join(ignore_dir, 'non-existing-ignore-rules')
      );
      assert.deepStrictEqual(rules, []);
    });
  });

  describe('create_ignore_filter', async () => {
    test('filter', async () => {
      const ignore_filter = create_ignore_filter('.', [
        '# Comment',
        'src',
        '*.ts',
        '**/*.js',
        '# Comment 2',
        'log.*',
        '# Comment multiline',
        '# Comment multiline 2',
        'dist/',
        'test/**/*',
      ]);

      assert.strictEqual(ignore_filter.path, '.');
      assert.ok(ignore_filter.filter.ignores('src/'));
      assert.ok(ignore_filter.filter.ignores('index.ts'));
      assert.ok(ignore_filter.filter.ignores('index.js'));
      assert.ok(ignore_filter.filter.ignores('log/log.txt'));
      assert.ok(ignore_filter.filter.ignores('dist/'));
      assert.ok(ignore_filter.filter.ignores('test/a'));
    });
  });

  describe('is_ignored', async () => {
    test('regular pattern', async () => {
      const ignore_filters = [
        create_ignore_filter('.', ['dist', 'coverage', '*.log', '*.zip']),
      ];

      assert.strictEqual(ignore_filters.length, 1);
      assert.strictEqual(ignore_filters[0].path, '.');

      assert.ok(is_ignored('out.zip', ignore_filters));
      assert.ok(is_ignored('dist/index.js', ignore_filters));
      assert.ok(is_ignored('app.log', ignore_filters));
      assert.ok(is_ignored('coverage', ignore_filters));
      assert.ok(is_ignored('coverage/test.html', ignore_filters));
      assert.ok(!is_ignored('index.ts', ignore_filters));
      assert.ok(!is_ignored('index.js', ignore_filters));
      assert.ok(!is_ignored('src', ignore_filters));
      assert.ok(!is_ignored('.gitignore', ignore_filters));
      assert.ok(!is_ignored('src/app', ignore_filters));
      assert.ok(!is_ignored('src/index.ts', ignore_filters));
      assert.ok(!is_ignored('src/util', ignore_filters));
      assert.ok(!is_ignored('src/base/index.ts', ignore_filters));
      assert.ok(!is_ignored('src/.gitignore', ignore_filters));

      ignore_filters.push(create_ignore_filter('test', ['_ignored_']));

      assert.strictEqual(ignore_filters.length, 2);
      assert.strictEqual(ignore_filters[1].path, 'test');

      assert.ok(is_ignored('test/_ignored_', ignore_filters));
      assert.ok(is_ignored('test/_ignored_/app', ignore_filters));
      assert.ok(is_ignored('test/_ignored_/app/test.ts', ignore_filters));
      assert.ok(is_ignored('test/out.zip', ignore_filters));
      assert.ok(!is_ignored('test/util', ignore_filters));
      assert.ok(!is_ignored('test/base/index.ts', ignore_filters));
      assert.ok(!is_ignored('test/.gitignore', ignore_filters));
    });

    test('negated pattern', async () => {
      const ignore_filters = [
        create_ignore_filter('.', ['*', '!src', 'src/**', '!.gitignore']),
      ];

      assert.strictEqual(ignore_filters.length, 1);
      assert.strictEqual(ignore_filters[0].path, '.');

      assert.ok(is_ignored('index.ts', ignore_filters));
      assert.ok(is_ignored('index.js', ignore_filters));
      assert.ok(is_ignored('out.zip', ignore_filters));
      assert.ok(is_ignored('src/index.ts', ignore_filters));
      assert.ok(!is_ignored('.', ignore_filters));
      assert.ok(!is_ignored('src', ignore_filters));
      assert.ok(!is_ignored('.gitignore', ignore_filters));

      ignore_filters.push(
        create_ignore_filter('src', ['!**/*.ts', '!util', '!.gitignore'])
      );

      assert.strictEqual(ignore_filters.length, 2);
      assert.strictEqual(ignore_filters[1].path, 'src');

      assert.ok(is_ignored('src/a', ignore_filters));
      assert.ok(!is_ignored('src/index.ts', ignore_filters));
      assert.ok(!is_ignored('src/util', ignore_filters));
      assert.ok(!is_ignored('src/base/index.ts', ignore_filters));
      assert.ok(!is_ignored('src/.gitignore', ignore_filters));
    });
  });
});
