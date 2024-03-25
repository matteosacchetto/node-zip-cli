import { join, relative, sep } from 'node:path';
import type { ArchiveEntry, TreePath } from '@/types/fs';
import chalk from 'chalk';
import { BooleanFilter } from './filter';
import { get_default_stats } from './fs';

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

const format_path = (path: string, mode: number) => {
  switch (mode) {
    case 0o100777:
    case 0o100775:
    case 0o100755: {
      return chalk.bold.green(path);
    }

    case 0o40775:
    case 0o40755: {
      return chalk.bold.blue(path);
    }

    case 0o41777: {
      return chalk.bgGreen.black(path);
    }

    case 0o40777: {
      return chalk.bgGreen.blue(path);
    }

    default: {
      return path;
    }
  }
};

const printObjAsFileTree = (obj: TreePath, level = 0, parentPrefix = '') => {
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

    const entry = obj[el];
    if (entry.type === 'directory') {
      stats.dirs += 1;
      console.log(`${prefix}${format_path(el + sep, entry.stats.mode)}`);
      const child_stats = printObjAsFileTree(
        entry.children,
        level + 1,
        i === keys.length - 1 ? `${parentPrefix}    ` : `${parentPrefix}│   `
      );
      stats.files += child_stats.files;
      stats.dirs += child_stats.dirs;
    } else if (entry.type === 'file') {
      stats.files += 1;
      console.log(`${prefix}${format_path(el, entry.stats.mode)}`);
    }
  }

  return stats;
};

export const printfileListAsFileTree = (entries: ArchiveEntry[]) => {
  const now = new Date();
  const root: TreePath = {};

  // Convert to object
  for (const entry of entries.sort((a, b) =>
    a.cleaned_path.localeCompare(b.cleaned_path)
  )) {
    const tokens = entry.cleaned_path.split(sep).filter(BooleanFilter);

    let node = root;
    for (let i = 0; i < tokens.length - 1; i++) {
      if (node[tokens[i]] === undefined) {
        node[tokens[i]] = {
          type: 'directory',
          stats: get_default_stats('directory', now),
          children: {},
        };
      }

      node = (
        node[tokens[i]] as Extract<TreePath[string], { type: 'directory' }>
      ).children;
    }

    if (entry.type === 'directory') {
      node[tokens[tokens.length - 1]] = {
        stats: entry.stats,
        children: {},
        type: 'directory',
      };
    } else {
      node[tokens[tokens.length - 1]] = {
        stats: entry.stats,
        type: 'file',
      };
    }
  }

  const stats = printObjAsFileTree(
    Object.keys(root).length === 1
      ? root
      : {
          '.': {
            type: 'directory',
            stats: get_default_stats('directory', now),
            children: root,
          },
        }
  );

  console.log(
    `\n${
      stats.dirs > 0
        ? `${stats.dirs} ${stats.dirs > 1 ? 'directories' : 'directory'}, `
        : ''
    }${
      stats.files > 0
        ? `${stats.files} ${stats.files > 1 ? 'files' : 'file'}`
        : ''
    }`
  );
};
