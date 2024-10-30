import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { date_from_utc, date_to_utc } from '@/utils/date';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  test('date_to_utc', async (context) => {
    const date = new Date();
    const utc_date = date_to_utc(date);

    assert.strictEqual(
      date.getTime() + date.getTimezoneOffset() * 60 * 1000,
      utc_date.getTime()
    );
  });

  test('date_from_utc', async (context) => {
    const date = new Date();
    const utc_date = date_from_utc(date);

    assert.strictEqual(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000,
      utc_date.getTime()
    );
  });

  test('both', async (context) => {
    const date = new Date();
    const utc_date = date_to_utc(date);
    const local_date = date_from_utc(utc_date);

    assert.strictEqual(local_date.getTime(), date.getTime());
  });
});
