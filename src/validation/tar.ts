import { basename } from 'node:path';
import { ValidationError } from '@/errors/validation-error';
import isValidFilename from 'valid-filename';

export const valid_tar_file_path = (path: string, gzip: boolean | number) => {
  if (gzip === false) {
    if (isValidFilename(basename(path)) && path.endsWith('.tar')) {
      return true;
    }

    throw new ValidationError(`${path} is not a valid tar path (gzip: on)`);
  }

  if (
    isValidFilename(basename(path)) &&
    (path.endsWith('.tar.gz') || path.endsWith('.tgz'))
  ) {
    return true;
  }
  throw new ValidationError(`${path} is not a valid tar path (gzip: on)`);
};
