// rollup.config.js
import json from '@rollup/plugin-json';
import eslint from '@rollup/plugin-eslint';
import typescript from '@rollup/plugin-typescript';
import run from '@rollup/plugin-run';

// Import dependencies
import { builtinModules } from 'module';
import { dependencies } from "./package.json"

const preferConst = true; // Use "const" instead of "var"
const isWatched = process.env.ROLLUP_WATCH === 'true'; // `true` if -w option is used

const nodeDependencies = builtinModules.filter(el => !el.startsWith('_')).flatMap(el => [el, `node:${el}`]);

export default {
  external: dependencies ? [...Object.keys(dependencies), ...nodeDependencies] : nodeDependencies,
  input: 'src/app.ts',
  output: {
    dir: 'dist',
    format: 'es',
    preferConst: preferConst,
    preserveModules: true,
    strict: true,
    entryFileNames: "[name].mjs"
  },
  plugins: [
    eslint({
      throwOnError: true
    }),
    json({
      preferConst: preferConst
    }),
    typescript(), 
    isWatched ? run() : undefined
  ]
};
