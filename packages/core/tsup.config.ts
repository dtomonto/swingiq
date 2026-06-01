import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
      // tsup's dts builder injects a baseUrl internally; TS 6 flags it as
      // deprecated (removed in TS 7). Silence until tsup/rollup-plugin-dts
      // stops emitting it.
      ignoreDeprecations: '6.0',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['zod'],
});
