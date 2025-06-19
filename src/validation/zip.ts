import { basename } from 'node:path';
import isValidFilename from 'valid-filename';
import { ValidationError } from '@/errors/validation-error';

export const valid_zip_file_path = (path: string) => {
  if (isValidFilename(basename(path)) && path.endsWith('.zip')) {
    return true;
  }

  throw new ValidationError(`${path} is not a valid zip path`);
};
