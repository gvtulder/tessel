import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.ts',
  output: {
    name: 'tilegame',
    dir: 'dist',
    format: 'iife',
    sourcemap: true,
    globals: {
      '@interactjs/interact/index': 'interact'
    }
  },
  plugins: [
    typescript({
      "compilerOptions": {
        "outDir": "dist/build-tsc/"
      },
    }),
    nodeResolve(),
  ],
  external: ['@interactjs/interact/index']
};
