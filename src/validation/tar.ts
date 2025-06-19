import { basename } from 'node:path';
import isValidFilename from 'valid-filename';
import { ValidationError } from '@/errors/validation-error';

export const valid_input_tar_file_path = (path: string) => {
  if (
    isValidFilename(basename(path)) &&
    (path.endsWith('.tar') || path.endsWith('.tar.gz') || path.endsWith('.tgz'))
  ) {
    return true;
  }

  throw new ValidationError(`${path} is not a valid tar path`);
};

export const valid_output_tar_file_path = (
  path: string,
  gzip: boolean | number
) => {
  if (gzip === false) {
    if (isValidFilename(basename(path)) && path.endsWith('.tar')) {
      return true;
    }

    throw new ValidationError(`${path} is not a valid tar path (gzip: off)`);
  }

  if (
    isValidFilename(basename(path)) &&
    (path.endsWith('.tar.gz') || path.endsWith('.tgz'))
  ) {
    return true;
  }
  throw new ValidationError(`${path} is not a valid tar path (gzip: on)`);
};
