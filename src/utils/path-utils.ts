import { join, relative } from 'path';

export const isChildOfCurrentDir = async (p: string) => {
  const cwd = process.cwd();
  const absoluteP = join(process.cwd(), p);

  const relativeP = relative(cwd, absoluteP);

  if (relativeP.startsWith('..')) {
    return false;
  }

  return true;
};
