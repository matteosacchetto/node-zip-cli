import { read_file_partial } from './fs';

export const get_full_mode = (
  partial_mode: number | string,
  type: 'file' | 'directory'
) => {
  if (type === 'file') return +partial_mode + 0o100000;
  if (type === 'directory') return +partial_mode + 0o40000;

  return +partial_mode;
};

export const is_gzip_archive = async (path: string) => {
  const data = await read_file_partial(path, {
    start: 0,
    end: 2,
  });

  if (data === null) {
    return false;
  }

  return is_gzip(data);
};

export const is_gzip = (buf: Buffer) => {
  if (!buf || buf.length < 3) {
    return false;
  }

  return (
    buf.readUint8() === 0x1f &&
    buf.readUint8(1) === 0x8b &&
    buf.readUint8(2) === 0x08
  );
};
