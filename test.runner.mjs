import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { run } from 'node:test';
import { spec, tap } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const {
  values: { parallel, only },
  positionals,
} = parseArgs({
  options: {
    parallel: {
      type: 'boolean',
      short: 'p',
      default: false,
    },
    only: {
      type: 'boolean',
      short: 'o',
      default: false,
    },
  },
  allowPositionals: true,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'test');

const files =
  positionals.length > 0
    ? positionals
    : (await readdir(dir, { recursive: true }))
        .filter((el) => el.endsWith('.test.ts'))
        .map((el) => join(dir, el));

run({ files, concurrency: parallel, only })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(process.stdout.isTTY ? new spec() : tap)
  .pipe(process.stdout);
