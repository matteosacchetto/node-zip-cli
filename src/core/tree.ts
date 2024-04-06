import { resolve, sep } from 'node:path';
import { colorize } from '@/core/dircolors';
import type { ArchiveEntry, CleanedEntryWithMode, TreePath } from '@/types/fs';
import { boolean_filter } from '@/utils/filter';
import {
  get_default_mode,
  get_default_stats,
  get_symlink_path,
} from '@/utils/fs';

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
    switch (entry.type) {
      case 'directory': {
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
        break;
      }

      case 'file': {
        stats.files += 1;
        console.log(`${prefix}${colorize(el, entry.stats.mode, is_windows)}`);
        break;
      }

      case 'symlink': {
        stats.files += 1;
        console.log(
          `${prefix}${colorize(
            el,
            entry.stats.mode,
            is_windows,
            entry.link_mode === undefined
          )} -> ${colorize(
            entry.link_name,
            entry.link_mode ?? get_default_mode('file'),
            is_windows,
            entry.link_mode === undefined
          )}`
        );
        break;
      }
    }
  }

  return stats;
};

export const printfile_list_as_file_tree = (
  entries: ArchiveEntry[],
  absolute_path_to_clean_entry_with_mode: Map<string, CleanedEntryWithMode>,
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

    switch (entry.type) {
      case 'directory': {
        node[tokens[tokens.length - 1]] = {
          stats: entry.stats,
          children: {},
          type: 'directory',
        };
        break;
      }

      case 'file': {
        node[tokens[tokens.length - 1]] = {
          stats: entry.stats,
          type: 'file',
        };
        break;
      }

      case 'symlink': {
        node[tokens[tokens.length - 1]] = {
          stats: entry.stats,
          type: 'symlink',
          link_path: entry.link_path,
          link_name: entry.link_name,
          link_mode: absolute_path_to_clean_entry_with_mode.get(
            resolve(get_symlink_path(entry.path, entry.link_path))
          )?.mode,
        };
        break;
      }
    }
  }

  if (Object.keys(root).length === 0) {
    // Not files to print
    return;
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
        ? `${stats.dirs} ${stats.dirs > 1 ? 'directories' : 'directory'}`
        : ''
    }${stats.dirs > 0 && stats.files > 0 ? ', ' : ''}${
      stats.files > 0
        ? `${stats.files} ${stats.files > 1 ? 'files' : 'file'}`
        : ''
    }`
  );
};
