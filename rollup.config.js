import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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
  plugins: [typescript(), nodeResolve()],
  external: ['@interactjs/interact/index']
};
