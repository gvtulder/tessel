import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/script.ts',
  output: {
    name: 'tilegame',
    dir: 'output',
    format: 'iife',
    sourcemap: true,
    globals: {
      'interactjs/interact': 'interact'
    }
  },
  plugins: [typescript(), nodeResolve()],
  external: ['interactjs/interact']
};
