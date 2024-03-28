import type { JSZipObject } from 'jszip';

export const is_symlink = (entry: JSZipObject) => {
  return (
    !entry.dir &&
    entry.unixPermissions &&
    (+entry.unixPermissions & 0o770000) >> 12 === 10
  );
};
