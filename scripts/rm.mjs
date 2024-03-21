import { rm } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { positionals: entries } = parseArgs({
  allowPositionals: true,
});

for (const entry of entries) {
  try {
    await rm(entry, { recursive: true, force: true });
  } catch (e) {
    console.error(e?.message ?? e);
    process.exit(1);
  }
}
