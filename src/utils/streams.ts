import type { Readable } from 'node:stream';

export const text = (read_stream: Readable) => {
  return new Promise<string>((res, rej) => {
    let text = '';
    read_stream.on('data', (chunk: Buffer | string) => {
      text += chunk.toString('utf-8');
    });
    read_stream.on('end', () => res(text));
    read_stream.on('error', (e) => rej(e));
  });
};
