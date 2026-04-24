import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: 'src/index.ts',
    'minify-png': 'bin/minify-png.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  sourcemap: true,
  target: 'node18',
});
