import { existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { createPathsMatcher, getTsconfig } from 'get-tsconfig';

export function watcher({ files }) {
  return {
    name: 'watcher',
    buildStart() {
      if (process.env.ROLLUP_WATCH === 'true')
        for (const file of files) {
          this.addWatchFile(resolve(file));
        }
    },
  };
}

export function resolveTsPaths({
  tsconfigPath = 'tsconfig.json',
  extensions = ['.ts'],
} = {}) {
  const tsconfig = getTsconfig(tsconfigPath);

  // Early return if no tsconfig found or no paths configured
  if (!tsconfig?.config?.compilerOptions?.paths) {
    return {
      name: 'resolve-ts-paths',
      resolveId() {
        return null;
      },
    };
  }

  const matchPath = createPathsMatcher(tsconfig);
  const cache = new Map();

  return {
    name: 'resolve-ts-paths',
    resolveId(source) {
      const resolved = cache.get(source);
      if (resolved) return resolved;

      const matched = matchPath?.(source);
      if (!matched?.length) return null;

      for (const match of matched) {
        const fullPath = normalize(match);

        // Try direct match
        for (const ext of extensions) {
          const filePath = fullPath + ext;
          if (existsSync(filePath)) {
            cache.set(source, filePath);
            return filePath;
          }
        }

        // Try directory index
        for (const ext of extensions) {
          const indexPath = join(fullPath, `index${ext}`);
          if (existsSync(indexPath)) {
            cache.set(source, indexPath);
            return indexPath;
          }
        }
      }

      // Cache negative results to avoid repeated lookups
      cache.set(source, null);
      return null;
    },
  };
}
