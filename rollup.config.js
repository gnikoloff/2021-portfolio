import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourcemaps from 'rollup-plugin-sourcemaps'
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/bundle.js', format: 'iife' },
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    sourcemaps(),
    copy({
      targets: [
          { src: `index.html`, dest: `dist` },
      ]
    })
  ],
}
