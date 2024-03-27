import { sep } from 'node:path';
import { colorize } from '@/core/dircolors';
import type { ArchiveEntry, TreePath } from '@/types/fs';
import { boolean_filter } from './filter';
import { get_default_stats } from './fs';

const print_obj_as_file_tree = (
  obj: TreePath,
  is_windows: boolean,
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

    const entry = obj[el];
    if (entry.type === 'directory') {
      stats.dirs += 1;
      console.log(
        `${prefix}${colorize(el + sep, entry.stats.mode, is_windows)}`
      );
      const child_stats = print_obj_as_file_tree(
        entry.children,
        is_windows,
        level + 1,
        i === keys.length - 1 ? `${parentPrefix}    ` : `${parentPrefix}│   `
      );
      stats.files += child_stats.files;
      stats.dirs += child_stats.dirs;
    } else if (entry.type === 'file') {
      stats.files += 1;
      console.log(`${prefix}${colorize(el, entry.stats.mode, is_windows)}`);
    }
  }

  return stats;
};

export const printfile_list_as_file_tree = (
  entries: ArchiveEntry[],
  is_windows: boolean
) => {
  const now = new Date();
  const root: TreePath = {};

  // Convert to object
  for (const entry of entries.sort((a, b) =>
    a.cleaned_path.localeCompare(b.cleaned_path)
  )) {
    const tokens = entry.cleaned_path.split(sep).filter(boolean_filter);

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

  const stats = print_obj_as_file_tree(
    Object.keys(root).length === 1
      ? root
      : {
          '.': {
            type: 'directory',
            stats: get_default_stats('directory', now),
            children: root,
          },
        },
    is_windows
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
