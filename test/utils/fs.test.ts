import assert from 'node:assert';
import {
  lstat,
  mkdir,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { platform } from 'node:os';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type {
  ArchiveEntry,
  CleanedEntryWithMode,
  ConflictingFsEntry,
  FsEntry,
} from '@/types/fs';
import {
  broken_symlinks,
  clean_path,
  exists,
  fix_mode,
  get_default_mode,
  get_default_stats,
  get_priority_for_type,
  get_symlink_path,
  is_directory,
  map_absolute_path_to_clean_entry_with_mode,
  normalize_windows_path,
  overwrite_symlink_if_exists,
  read_access,
  resolve_symlink,
  set_permissions,
  type_compare,
  unique_entries,
  unique_fs_entries,
} from '@/utils/fs';

const data_dir = join(process.cwd(), 'test', '_data_');
const write_dir = join(process.cwd(), 'test', '_write_');

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('get_priority_for_type', async () => {
    test('directory', async () => {
      assert.strictEqual(get_priority_for_type('directory'), 1);
    });

    test('file', async () => {
      assert.strictEqual(get_priority_for_type('file'), 2);
    });

    test('symlink', async () => {
      assert.strictEqual(get_priority_for_type('symlink'), 3);
    });
  });

  describe('type_compare', async () => {
    test('directory vs directory', async () => {
      assert.ok(type_compare('directory', 'directory') === 0);
    });

    test('directory vs file', async () => {
      assert.ok(type_compare('directory', 'file') < 0);
    });

    test('directory vs symlink', async () => {
      assert.ok(type_compare('directory', 'symlink') < 0);
    });

    test('file vs directory', async () => {
      assert.ok(type_compare('file', 'directory') > 0);
    });

    test('file vs file', async () => {
      assert.ok(type_compare('file', 'file') === 0);
    });

    test('file vs symlink', async () => {
      assert.ok(type_compare('file', 'symlink') < 0);
    });

    test('symlink vs directory', async () => {
      assert.ok(type_compare('symlink', 'directory') > 0);
    });

    test('symlink vs file', async () => {
      assert.ok(type_compare('symlink', 'file') > 0);
    });

    test('symlink vs symlink', async () => {
      assert.ok(type_compare('symlink', 'symlink') === 0);
    });
  });

  describe('get_default_mode', async () => {
    test('file', async () => {
      assert.strictEqual(get_default_mode('file'), 0o100664);
    });

    test('directory', async () => {
      assert.strictEqual(get_default_mode('directory'), 0o40775);
    });

    test('symlink', async () => {
      assert.strictEqual(get_default_mode('symlink'), 0o120777);
    });
  });

  describe('fix_mode', async () => {
    test('file: 0o100666 windows', async () => {
      assert.strictEqual(fix_mode(0o100666, true), 0o100664);
    });

    test('file: 0o100777 windows', async () => {
      assert.strictEqual(fix_mode(0o100777, true), 0o100664);
    });

    test('file: 0o100666 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o100666, false), 0o100666);
    });

    test('file: 0o100777 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o100777, false), 0o100777);
    });

    test('directory: 0o40666 windows', async () => {
      assert.strictEqual(fix_mode(0o40666, true), 0o40775);
    });

    test('directory: 0o40777 windows', async () => {
      assert.strictEqual(fix_mode(0o40777, true), 0o40775);
    });

    test('directory: 0o40666 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o40666, false), 0o40666);
    });

    test('directory: 0o40777 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o40777, false), 0o40777);
    });

    test('symlink: 0o120666 windows', async () => {
      assert.strictEqual(fix_mode(0o120666, true), 0o120777);
    });

    test('symlink: 0o120777 windows', async () => {
      assert.strictEqual(fix_mode(0o120777, true), 0o120777);
    });

    test('symlink: 0o120666 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o120666, false), 0o120666);
    });

    test('symlink: 0o120777 unix/linux', async () => {
      assert.strictEqual(fix_mode(0o120777, false), 0o120777);
    });
  });

  describe('get_default_stats', async () => {
    test('file', async () => {
      const now = new Date();
      assert.deepEqual(get_default_stats('file', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o100664,
        mtime: now,
      });
    });

    test('directory', async () => {
      const now = new Date();
      assert.deepEqual(get_default_stats('directory', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o40775,
        mtime: now,
      });
    });

    test('symlink', async () => {
      const now = new Date();
      assert.deepEqual(get_default_stats('symlink', now), <
        ReturnType<typeof get_default_stats>
      >{
        uid: 1000,
        gid: 1000,
        mode: 0o120777,
        mtime: now,
      });
    });
  });

  describe('normalize_windows_path', async () => {
    test('src: posix/unix', async () => {
      assert.strictEqual(normalize_windows_path('src', false), 'src');
    });

    test('./src: posix/unix', async () => {
      assert.strictEqual(normalize_windows_path('./src', false), './src');
    });

    test('.\\src: posix/unix', async () => {
      assert.strictEqual(normalize_windows_path('.\\src', false), '.\\src');
    });

    test('.\\src: windows', async () => {
      assert.strictEqual(normalize_windows_path('.\\src', true), './src');
    });

    test('..\\src: posix/unix', async () => {
      assert.strictEqual(normalize_windows_path('..\\src', false), '..\\src');
    });

    test('..\\src: windows', async () => {
      assert.strictEqual(normalize_windows_path('..\\src', true), '../src');
    });

    test('..\\src\\a\\b: posix/unix', async () => {
      assert.strictEqual(
        normalize_windows_path('..\\src\\a\\b', false),
        '..\\src\\a\\b'
      );
    });

    test('..\\src\\a\\b: windows', async () => {
      assert.strictEqual(
        normalize_windows_path('..\\src\\a\\b', true),
        '../src/a/b'
      );
    });
  });

  describe('clean_path', async () => {
    test('src', async () => {
      assert.strictEqual(clean_path('src'), 'src');
    });

    test('src/: ensure trailing slash is removed', async () => {
      assert.strictEqual(clean_path('src/'), 'src');
    });

    test('../src', async () => {
      assert.strictEqual(clean_path(join('..', 'src')), 'src');
    });

    test('./src', async () => {
      assert.strictEqual(clean_path('./src'), 'src');
    });

    test('/src', async () => {
      assert.strictEqual(clean_path('/src'), 'src');
    });

    test('../test/src', async () => {
      assert.strictEqual(clean_path('../test/src'), join('test', 'src'));
    });

    test('//test/src', async () => {
      assert.strictEqual(clean_path('//test/src'), join('test', 'src'));
    });

    test('////test/src', async () => {
      assert.strictEqual(clean_path('////test/src'), join('test', 'src'));
    });

    test('//src', async () => {
      assert.strictEqual(clean_path('//src'), 'src');
    });

    test('/', async () => {
      assert.strictEqual(clean_path('/'), '');
    });

    test('//', async () => {
      assert.strictEqual(clean_path('//'), '');
    });

    test('///', async () => {
      assert.strictEqual(clean_path('///'), '');
    });

    test('.', async () => {
      assert.strictEqual(clean_path('.'), '');
    });

    test('..', async () => {
      assert.strictEqual(clean_path('..'), '');
    });

    test(
      'src\\: ensure trailing separator is removed',
      {
        skip:
          platform() !== 'win32'
            ? 'This test checks if on windows it properly handles \\ separator'
            : undefined,
      },
      async () => {
        assert.strictEqual(clean_path('src\\'), 'src');
      }
    );

    test(
      '..\\src\\test',
      {
        skip:
          platform() !== 'win32'
            ? 'This test checks if on windows it properly handles \\ separator'
            : undefined,
      },
      async () => {
        assert.strictEqual(clean_path('..\\src\\test'), 'src\\test');
      }
    );

    test(
      'C:\\src\\test',
      {
        skip:
          platform() !== 'win32'
            ? 'This test checks if on windows it properly handles C:\\ separator'
            : undefined,
      },
      async () => {
        assert.strictEqual(clean_path('C:\\src\\test'), 'src\\test');
      }
    );
  });

  describe('unique_fs_entries', async () => {
    test('no conflict', async () => {
      const now = new Date();
      const entries: FsEntry[] = [
        {
          path: 'src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: 'src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
      ];

      assert.deepStrictEqual(unique_fs_entries(entries), [entries, []]);
    });

    test('conflicts', async () => {
      const now = new Date();
      const entries: FsEntry[] = [
        {
          path: 'src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: 'src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
        {
          path: '../src',
          cleaned_path: 'src',
          stats: { ...get_default_stats('directory', now), size: 0 },
          type: 'directory',
          n_children: 1,
        },
        {
          path: '../src/file',
          cleaned_path: 'src/file',
          stats: { ...get_default_stats('file', now), size: 0 },
          type: 'file',
        },
      ].sort((a, b) => a.path.localeCompare(b.path)) as FsEntry[];

      assert.deepStrictEqual(unique_fs_entries(entries), [
        [entries[0], entries[2]],
        <ConflictingFsEntry[]>[
          {
            conflicting_path: entries[1].path,
            conflicting_with_path: entries[0].path,
          },
          {
            conflicting_path: entries[3].path,
            conflicting_with_path: entries[2].path,
          },
        ],
      ]);
    });
  });

  describe('unique_entries', async () => {
    test('single entry: src', async () => {
      assert.deepStrictEqual(unique_entries(['src']), ['src']);
    });

    test('mulitple entry: src, ./src', async () => {
      assert.deepStrictEqual(unique_entries(['src', './src']), ['src']);
    });

    test('mulitple entry: src, ./src, join(process.cwd(), src)', async () => {
      assert.deepStrictEqual(
        unique_entries(['src', './src', join(process.cwd(), 'src')]),
        ['src']
      );
    });

    test('mulitple entry: src, test', async () => {
      assert.deepStrictEqual(unique_entries(['src', 'test']), ['src', 'test']);
    });
  });

  describe('map_absolute_path_to_clean_entry_with_mode', async () => {
    test('1 file, 1 directory and 1 symlink', async () => {
      const now = new Date();
      const list: ArchiveEntry[] = [
        {
          type: 'file',
          path: 'test.ts',
          cleaned_path: 'test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'directory',
          path: 'src',
          cleaned_path: 'src',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'symlink',
          path: 'link',
          cleaned_path: 'link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120775,
            mtime: now,
            size: 4,
          },
          link_name: 'src',
          link_path: './src',
        },
      ];

      const map = map_absolute_path_to_clean_entry_with_mode(list);

      assert.strictEqual(map.size, 3);
      assert.deepStrictEqual(map.get(resolve('test.ts')), <
        CleanedEntryWithMode
      >{
        cleaned_path: list[0].cleaned_path,
        mode: list[0].stats.mode,
      });
      assert.deepStrictEqual(map.get(resolve('src')), <CleanedEntryWithMode>{
        cleaned_path: list[1].cleaned_path,
        mode: list[1].stats.mode,
      });

      assert.deepStrictEqual(map.get(resolve('link')), <CleanedEntryWithMode>{
        cleaned_path: list[2].cleaned_path,
        mode: list[2].stats.mode,
      });
    });
  });

  describe('broken_symlinks', async () => {
    test('symlink: link to existing dir', async () => {
      const now = new Date();
      const list: ArchiveEntry[] = [
        {
          type: 'file',
          path: 'test.ts',
          cleaned_path: 'test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'directory',
          path: 'src',
          cleaned_path: 'src',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'symlink',
          path: 'link',
          cleaned_path: 'link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120775,
            mtime: now,
            size: 4,
          },
          link_name: 'src',
          link_path: './src',
        },
      ];

      const map = map_absolute_path_to_clean_entry_with_mode(list);
      const broken = broken_symlinks(list, map);

      assert.strictEqual(broken.length, 0);
    });

    test('symlink: link to existing file', async () => {
      const now = new Date();
      const list: ArchiveEntry[] = [
        {
          type: 'file',
          path: 'test.ts',
          cleaned_path: 'test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'directory',
          path: 'src',
          cleaned_path: 'src',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'symlink',
          path: 'link',
          cleaned_path: 'link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120775,
            mtime: now,
            size: 4,
          },
          link_name: 'test',
          link_path: './test.ts',
        },
      ];

      const map = map_absolute_path_to_clean_entry_with_mode(list);
      const broken = broken_symlinks(list, map);

      assert.strictEqual(broken.length, 0);
    });

    test('symlink: broken link', async () => {
      const now = new Date();
      const list: ArchiveEntry[] = [
        {
          type: 'file',
          path: 'test.ts',
          cleaned_path: 'test.ts',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o100664,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'directory',
          path: 'src',
          cleaned_path: 'src',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o40775,
            mtime: now,
            size: 4,
          },
        },
        {
          type: 'symlink',
          path: 'link',
          cleaned_path: 'link',
          stats: {
            uid: 1000,
            gid: 1000,
            mode: 0o120775,
            mtime: now,
            size: 4,
          },
          link_name: 'foo',
          link_path: './foo.ts',
        },
      ];

      const map = map_absolute_path_to_clean_entry_with_mode(list);
      const broken = broken_symlinks(list, map);

      assert.strictEqual(broken.length, 1);
      assert.strictEqual(broken[0].cleaned_path, list[2].cleaned_path);
      assert.strictEqual(
        broken[0].link_name,
        (list[2] as Extract<ArchiveEntry, { type: 'symlink' }>).link_name
      );
    });
  });

  describe('exists', async () => {
    test('base.tar', async () => {
      assert.ok(await exists(join(data_dir, 'base.tar')));
    });

    test('base.nonexists', async () => {
      assert.ok(!(await exists(join(data_dir, 'base.nonexists'))));
    });
  });

  describe('is_directory', async () => {
    test('test/_data_', async () => {
      assert.ok(await is_directory(data_dir));
    });

    test('test/_data_/base.tar', async () => {
      assert.ok(!(await is_directory(join(data_dir, 'base.tar'))));
    });

    test('test/_data_/base.nonexists', async () => {
      assert.ok(!(await is_directory(join(data_dir, 'base.nonexists'))));
    });
  });

  describe('read_access', async () => {
    test('test/_data_', async () => {
      assert.ok(await read_access(data_dir));
    });

    test('test/_data_/base.tar', async () => {
      assert.ok(await read_access(join(data_dir, 'base.tar')));
    });

    test('test/_data_/base.nonexists', async () => {
      assert.ok(!(await read_access(join(data_dir, 'base.nonexists'))));
    });
  });

  describe('get_symlink_path', async () => {
    test('relative: ../utils', async () => {
      assert.equal(get_symlink_path('test', '../utils'), join('..', 'utils'));
    });

    test('relative: ../utils', async () => {
      assert.equal(
        get_symlink_path('test', join('..', 'utils')),
        join('..', 'utils')
      );
    });

    test('relative: utils', async () => {
      assert.equal(get_symlink_path('test', 'utils'), 'utils');
    });

    test('relative: utils', async () => {
      assert.equal(
        get_symlink_path(join('test', 'abc'), 'utils'),
        join('test', 'utils')
      );
    });

    test('absolute: /utils', async () => {
      assert.equal(
        get_symlink_path(join('test', 'abc'), '/utils'),
        normalize('/utils')
      );
    });
  });

  describe(
    'set_permissions',
    {
      skip:
        platform() === 'win32'
          ? 'Windows does not support setting permissions'
          : undefined,
    },
    async () => {
      const permissions_dir = join(write_dir, 'set_permissions');

      beforeEach(async () => {
        await mkdir(permissions_dir, { recursive: true });
      });

      afterEach(async () => {
        await rm(permissions_dir, { recursive: true });
      });

      test('set file mode', async () => {
        const file = join(permissions_dir, 'tmp.txt');
        await writeFile(file, '');

        await set_permissions(file, { mode: 0o100777 });

        const { mode } = await lstat(file);

        assert.strictEqual(mode, 0o100777);
      });

      test('set file mtime', async () => {
        const file = join(permissions_dir, 'tmp1.txt');
        const now = new Date();
        const ten_seconds_ago = new Date(now.getTime() - 10000);

        await writeFile(file, '');

        await set_permissions(file, { mtime: ten_seconds_ago });

        const { mtime } = await lstat(file);

        assert.strictEqual(mtime.getTime(), ten_seconds_ago.getTime());
      });

      test(
        'set file owner',
        {
          skip:
            !process.getuid || process.getuid() !== 0
              ? 'Only root can change the owner of a file'
              : undefined,
        },
        async () => {
          const file = join(permissions_dir, 'tmp2.txt');
          const _uid = 1000,
            _gid = 1000;

          await writeFile(file, '');

          await set_permissions(file, { uid: _uid, gid: _gid });

          const { uid, gid } = await lstat(file);

          assert.strictEqual(uid, _uid);
          assert.strictEqual(gid, _gid);
        }
      );
    }
  );

  describe(
    'overwrite_symlink_if_exists',
    {
      skip:
        platform() === 'win32'
          ? 'Windows does not hnalde correctly symlinks'
          : undefined,
    },
    async () => {
      const overwrite_symlink_dir = join(
        write_dir,
        'overwrite_symlink_if_exists'
      );

      beforeEach(async () => {
        await mkdir(overwrite_symlink_dir, { recursive: true });
      });

      afterEach(async () => {
        await rm(overwrite_symlink_dir, { recursive: true });
      });

      test('create symlink', async () => {
        const file = join(overwrite_symlink_dir, 'tmp.txt');
        const link = join(overwrite_symlink_dir, 'link.txt');

        await writeFile(file, '');

        await overwrite_symlink_if_exists(file, link);
        const new_linked_path = await readlink(link);
        assert.strictEqual(new_linked_path, file);
      });

      test('create dangling symlink', async () => {
        const link = join(overwrite_symlink_dir, 'link.txt');

        await overwrite_symlink_if_exists('./tmp.txt', link);
        const new_linked_path = await readlink(link);
        assert.strictEqual(new_linked_path, './tmp.txt');
      });

      test('create symlink: relative', async () => {
        const file = join(overwrite_symlink_dir, 'tmp-1.txt');
        const link = join(overwrite_symlink_dir, 'link-1.txt');

        await writeFile(file, '');

        await overwrite_symlink_if_exists(relative(dirname(link), file), link);
        const new_linked_path = await readlink(link);
        assert.strictEqual(new_linked_path, relative(dirname(link), file));
      });

      test('overwrite existing symlink', async () => {
        const file = join(overwrite_symlink_dir, 'tmp-2.txt');
        const file1 = join(overwrite_symlink_dir, 'tmp-3.txt');
        const link = join(overwrite_symlink_dir, 'link-2.txt');

        await writeFile(file, '');
        await writeFile(file1, '');
        await symlink(file, link);

        const linked_path = await readlink(link);
        assert.strictEqual(linked_path, file);

        await overwrite_symlink_if_exists(file1, link);
        const new_linked_path = await readlink(link);
        assert.strictEqual(new_linked_path, file1);
      });

      test('overwrite existing symlink: relative', async () => {
        const file = join(overwrite_symlink_dir, 'tmp-4.txt');
        const file1 = join(overwrite_symlink_dir, 'tmp-5.txt');
        const link = join(overwrite_symlink_dir, 'link-4.txt');

        await writeFile(file, '');
        await writeFile(file1, '');
        await symlink(relative(dirname(link), file), link);

        const linked_path = await readlink(link);
        assert.strictEqual(linked_path, relative(dirname(link), file));

        await overwrite_symlink_if_exists(relative(dirname(link), file1), link);
        const new_linked_path = await readlink(link);
        assert.strictEqual(new_linked_path, relative(dirname(link), file1));
      });
    }
  );

  describe(
    'resolve_symlink',
    {
      skip:
        platform() === 'win32'
          ? 'Windows does not hnalde correctly symlinks'
          : undefined,
    },
    async () => {
      const resolve_symlink_dir = join(write_dir, 'resolve_symlink');

      beforeEach(async () => {
        await mkdir(resolve_symlink_dir, { recursive: true });
      });

      afterEach(async () => {
        await rm(resolve_symlink_dir, { recursive: true });
      });

      test('symlink: absolute', async () => {
        const file = join(resolve_symlink_dir, 'tmp.txt');
        const link = join(resolve_symlink_dir, 'link.txt');

        await writeFile(file, '');

        await symlink(file, link);
        const link_path = await resolve_symlink(link);
        assert.strictEqual(link_path, file);
      });

      test('symlink: relative', async () => {
        const file = join(resolve_symlink_dir, 'tmp-1.txt');
        const link = join(resolve_symlink_dir, 'link-1.txt');

        await writeFile(file, '');

        await symlink(relative(dirname(link), file), link);
        const link_path = await resolve_symlink(link);
        assert.strictEqual(link_path, file);
      });
    }
  );
});
