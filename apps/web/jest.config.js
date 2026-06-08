/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Use a project-local transform cache instead of the machine-global
  // %TEMP%/jest. Several agents run jest concurrently on this box; sharing the
  // global cache lets a cold-cache "thundering herd" race corrupt entries,
  // after which jest falls back to babel-jest (no @babel/preset-typescript) and
  // chokes on `type` import specifiers. A per-checkout cache removes that
  // cross-process contention. Lives under node_modules (already gitignored).
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@swingiq/core$': '<rootDir>/../../packages/core/dist/index.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: {
        paths: {
          '@/*': ['./src/*'],
        },
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;
