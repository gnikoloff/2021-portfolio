import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourcemaps from 'rollup-plugin-sourcemaps'
import copy from 'rollup-plugin-copy'
import css from 'rollup-plugin-import-css'

export default {
  input: 'src/index.js',
  output: [{ file: 'dist/bundle.js', format: 'iife' }],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    css(),
    commonjs(),
    nodeResolve(),
    sourcemaps(),
    copy({
      targets: [{ src: `index.html`, dest: `dist` }],
    }),
  ],
}
