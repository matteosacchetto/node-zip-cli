import type { Plugin } from 'rollup';

export type WatcherOptions = {
  files: string[];
};

export type ResolveTsPathsOptions = {
  tsconfigPath?: string;
  extensions?: string[];
};

/**
 * Watch additional files
 */
export function watcher(options: WatcherOptions): Plugin;

/**
 * Rollup plugin to resolve TypeScript path mappings
 */
export function resolveTsPaths(options?: ResolveTsPathsOptions): Plugin;
