import type { Readable } from 'node:stream';
import yauzl from 'yauzl';
import { defer } from './promise';

export const is_symlink = (mode: number) => {
  return (mode & 0o770000) >> 12 === 10;
};

export const open_zip_file = (
  input_path: string,
  options: Omit<yauzl.Options, 'lazyEntries'> = {
    autoClose: true,
    validateEntrySizes: true,
  }
): Promise<yauzl.ZipFile> => {
  return new Promise<yauzl.ZipFile>((res, rej) =>
    yauzl.open(
      input_path,
      {
        lazyEntries: true,
        ...options,
      },
      (err, file) => {
        /* c8 ignore next 2 */
        if (err) rej(err);
        else res(file);
      }
    )
  );
};

export const open_read_stream = (zip: yauzl.ZipFile, entry: yauzl.Entry) => {
  return new Promise<Readable>((res, rej) => {
    zip.openReadStream(entry, (err, readStream) => {
      /* c8 ignore next 2 */
      if (err) rej(err);
      else res(readStream);
    });
  });
};

export function read_entry(zip: yauzl.ZipFile) {
  let rejectNext: ((e: Error) => void) | undefined,
    resolveNext:
      | ((data: IteratorResult<yauzl.Entry, undefined>) => void)
      | undefined;
  zip.on('entry', (entry) => {
    resolveNext?.({ value: entry, done: false });
  });

  zip.on('error', (error) => {
    /* c8 ignore next 1 */
    rejectNext?.(error);
  });

  zip.on('end', () => {
    /* c8 ignore next 1 */
    resolveNext?.({ value: undefined, done: true });
  });

  return {
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          zip.readEntry(); // Read the next entry
          const { promise, resolve, reject } =
            defer<IteratorResult<yauzl.Entry, undefined>>();
          resolveNext = resolve;
          rejectNext = reject;
          return promise;
        },
        return() {
          /* c8 ignore start */
          zip.close();
          return Promise.resolve<IteratorReturnResult<undefined>>({
            value: undefined,
            done: true,
          });
          /* c8 ignore end */
        },
      };
    },
  };
}
