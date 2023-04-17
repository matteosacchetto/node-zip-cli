import chalk from 'chalk';
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

const printObjAsFileTree = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>,
  level = 0,
  isLast = false
) => {
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const el = keys[i];
    let prefix = '';
    if (level > 0) {
      if (i === keys.length - 1) {
        prefix = `${isLast ? ' ' : '│'}   `.repeat(level - 1) + '└── ';
      } else {
        prefix = `${isLast ? ' ' : '│'}   `.repeat(level - 1) + '├── ';
      }
    }

    if (typeof obj[el] === 'object') {
      console.log(`${prefix}${chalk.blue.bold(el + sep)}`);
      if (!isLast && level === 1 && i === keys.length - 1) {
        isLast = true;
      }
      printObjAsFileTree(obj[el], level + 1, isLast);
    } else if (typeof obj[el] === 'boolean') {
      console.log(`${prefix}${el}`);
    }
  }
};

export const printfileListAsFileTree = (files: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: Record<string, any> = {};

  // Convert to object
  for (const path of files.sort()) {
    const tokens = path.split(sep);
    let node = root;

    for (let i = 0; i < tokens.length - 1; i++) {
      if (node[tokens[i]] === undefined) {
        node[tokens[i]] = {};
      }
      node = node[tokens[i]];
    }

    node[tokens[tokens.length - 1]] = true;
  }

  printObjAsFileTree(
    Object.keys(root).length === 1
      ? root
      : {
          '.': root,
        }
  );

  console.log(`\n${files.length} ${files.length > 1 ? 'files' : 'file'}`);
};
