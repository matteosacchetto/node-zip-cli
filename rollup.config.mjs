// rollup.config.mjs
import json from '@rollup/plugin-json';
import run from '@rollup/plugin-run';
import typescript from '@rollup/plugin-typescript';
import esbuild from 'rollup-plugin-esbuild';
import externals from 'rollup-plugin-node-externals';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

const preferConst = true; // Use "const" instead of "var"
const usePreserveModules = false; // `true` -> keep modules structure, `false` -> combine everything into a single file
const useThrowOnError = true; // On error throw and exception
const useEsbuild = true; // `true` -> use esbuild, `false` use tsc

const isCli = true; // `true` -> is a CLI so bunlde to a single file, `false` not a cli, so use `usePreserveModules`
const isWatched = process.env.ROLLUP_WATCH === 'true'; // `true` if -w option is used
const useSourceMaps = process.env.NODE_ENV === 'debug'; // gerenetae sourcemaps only for debug

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/app.ts',
  output: {
    dir: 'dist',
    format: 'es',
    generatedCode: {
      constBindings: preferConst,
    },
    preserveModules: isCli ? false : usePreserveModules,
    strict: true,
    entryFileNames: '[name].mjs',
    banner: isCli ? '#!/usr/bin/env node' : undefined,
    sourcemap: useSourceMaps,
  },
  plugins: [
    externals(),
    json({
      preferConst: preferConst,
    }),
    useEsbuild
      ? [
          typescriptPaths({
            preserveExtensions: true,
          }),
          esbuild({
            legalComments: 'none',
            target: 'esnext',
          }),
        ]
      : typescript({
          noEmitOnError: useThrowOnError,
          removeComments: true,
        }),
    isWatched ? run() : undefined,
  ],
};
