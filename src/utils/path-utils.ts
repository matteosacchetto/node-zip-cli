import { join, relative, sep } from 'path';

export const isChildOfCurrentDir = async (p: string) => {
  const cwd = process.cwd();
  const absoluteP = join(process.cwd(), p);

  const relativeP = relative(cwd, absoluteP);

  if (relativeP.startsWith('..')) {
    return false;
  }

  return true;
};

export const getFilename = (p: string) => {
  return p.split(sep).at(-1) ?? '';
};
