import { basename } from 'node:path';
import { ValidationError } from '@/errors/validation-error';
import isValidFilename from 'valid-filename';

export const valid_zip_file_path = (path: string) => {
  if (isValidFilename(basename(path)) && path.endsWith('.zip')) {
    return true;
  }

  throw new ValidationError(`${path} is not a valid zip path`);
};
