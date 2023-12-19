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
  obj: Record<string, any>,
  level = 0,
  parentPrefix = ''
) => {
  const keys = Object.keys(obj);
  const usableParentPrefix = parentPrefix.slice(4);
  for (let i = 0; i < keys.length; i++) {
    const el = keys[i];
    let prefix = '';
    if (level > 0) {
      if (i === keys.length - 1) {
        prefix = usableParentPrefix + '└── ';
      } else {
        prefix = usableParentPrefix + '├── ';
      }
    }

    if (typeof obj[el] === 'object') {
      console.log(`${prefix}${chalk.blue.bold(el + sep)}`);
      printObjAsFileTree(
        obj[el],
        level + 1,
        i === keys.length - 1 ? parentPrefix + '    ' : parentPrefix + '│   '
      );
    } else if (typeof obj[el] === 'boolean') {
      console.log(`${prefix}${el}`);
    }
  }
};

export const printfileListAsFileTree = (files: string[]) => {
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
