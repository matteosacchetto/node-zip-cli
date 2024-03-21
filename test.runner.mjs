import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { run } from 'node:test';
import { spec, tap } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const {
  values: { parallel },
} = parseArgs({
  options: {
    parallel: {
      type: 'boolean',
      short: 'p',
      default: false,
    },
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'test');

const files = (await readdir(dir, { recursive: true }))
  .filter((el) => el.endsWith('.test.ts'))
  .map((el) => join(dir, el));

run({ files, concurrency: parallel })
  .compose(process.stdout.isTTY ? new spec() : tap)
  .pipe(process.stdout);
