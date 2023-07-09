import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import strip from '@rollup/plugin-strip';
import copy from 'rollup-plugin-copy';
import { generateSW } from 'rollup-plugin-workbox';

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
  plugins: [
    strip({
      include: [
        '**/*.js',
        '**/*.ts',
      ],
      functions: [
        'console.*',
      ],
    }),
    typescript({
      "compilerOptions": {
        "outDir": "public/dist/build-tsc"
      },
    }),
    nodeResolve(),
    terser(),
    copy({
      targets: [
        { src: 'manifest.json', dest: 'public/' },
        { src: 'index.html', dest: 'public/' },
        { src: 'icon.png', dest: 'public/' },
        { src: 'style.css', dest: 'public/' },
        { src: 'fonts/barlow-latin-400.woff', dest: 'public/fonts/' },
        { src: 'interact.1.10.17.min.js', dest: 'public/' },
      ]
    }),
    generateSW({
      swDest: "public/sw.js",
      globDirectory: "public/",
      globPatterns: [],
      sourcemap: false,
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: new RegExp('cloudflare'),
          handler: 'NetworkOnly',
        },
        {
          urlPattern: new RegExp('.*(js|css|png|html|woff)'),
          handler: 'StaleWhileRevalidate',
        },
      ],
    }),
  ],
  external: ['@interactjs/interact/index']
};
