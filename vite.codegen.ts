import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/codegen'],
      exclude: ['src/codegen/template.ts'],
      outDirs: [
        { dir: 'dist/codegen', moduleFormat: 'cjs' },
        { dir: 'dist/codegen', moduleFormat: 'esm' },
      ],
    }),
  ],
  build: {
    lib: {
      entry: 'src/codegen/sveltekit-routes.ts',
      formats: ['cjs', 'es'],
      name: 'sveltekitRoutes',
      fileName: 'sveltekit-routes',
    },
    outDir: 'dist/codegen',
    minify: false,
  },
});
