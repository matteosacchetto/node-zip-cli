// jest.config.js
import { join } from 'path'
import { pathsToModuleNameMapper } from 'ts-jest'
import tsconfig from './tsconfig.json' assert {type: 'json'};

const { compilerOptions } = tsconfig;

export default {
  preset: 'ts-jest', // Enable typescript support
  testEnvironment: 'node', // We are in node
  verbose: true, // Versbose output
  collectCoverage: true, // Show also coverage
  coverageProvider: "v8", // Generate file using the v8 engine
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      tsconfig: compilerOptions, // Config file
      useESM: true,
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths , { prefix: join('<rootDir>', compilerOptions.baseUrl) }), // Map aliases to their path
  transform: {}
}