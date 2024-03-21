import { join, relative, sep } from 'node:path';
import chalk from 'chalk';

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

type TreePath<T> = {
  [key: string]: T | TreePath<T>;
};

const printObjAsFileTree = (
  obj: TreePath<boolean>,
  level = 0,
  parentPrefix = ''
) => {
  const stats = {
    files: 0,
    dirs: 0,
  };
  const keys = Object.keys(obj);
  const usableParentPrefix = parentPrefix.slice(4);
  for (let i = 0; i < keys.length; i++) {
    const el = keys[i];
    let prefix = '';
    if (level > 0) {
      if (i === keys.length - 1) {
        prefix = `${usableParentPrefix}└── `;
      } else {
        prefix = `${usableParentPrefix}├── `;
      }
    }

    if (typeof obj[el] === 'object') {
      stats.dirs += 1;
      console.log(`${prefix}${chalk.blue.bold(el + sep)}`);
      const child_stats = printObjAsFileTree(
        obj[el] as TreePath<boolean>,
        level + 1,
        i === keys.length - 1 ? `${parentPrefix}    ` : `${parentPrefix}│   `
      );
      stats.files += child_stats.files;
      stats.dirs += child_stats.dirs;
    } else if (typeof obj[el] === 'boolean') {
      stats.files += 1;
      console.log(`${prefix}${el}`);
    }
  }

  return stats;
};

export const printfileListAsFileTree = (files: string[]) => {
  const root: TreePath<boolean> = {};

  // Convert to object
  for (const path of files.sort()) {
    const tokens = path.split(sep);
    let node = root;

    for (let i = 0; i < tokens.length - 1; i++) {
      if (node[tokens[i]] === undefined) {
        node[tokens[i]] = {};
      }
      node = node[tokens[i]] as TreePath<boolean>;
    }

    node[tokens[tokens.length - 1]] = true;
  }

  const stats = printObjAsFileTree(
    Object.keys(root).length === 1
      ? root
      : {
          '.': root,
        }
  );

  console.log(
    `\n${
      stats.dirs > 0
        ? `${stats.dirs} ${stats.dirs > 1 ? 'directories' : 'directory'}, `
        : ''
    }${
      stats.files > 0
        ? `${stats.files} ${files.length > 1 ? 'files' : 'file'}`
        : ''
    }`
  );
};
