import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.ts',
  output: {
    name: 'tilegame',
    dir: 'public/dist/',
    format: 'iife',
    sourcemap: false,
    globals: {
      '@interactjs/interact/index': 'interact'
    }
  },
  plugins: [typescript(), nodeResolve(), terser()],
  external: ['@interactjs/interact/index']
};
