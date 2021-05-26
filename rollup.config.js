import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourcemaps from 'rollup-plugin-sourcemaps'
import copy from 'rollup-plugin-copy'
import css from 'rollup-plugin-import-css'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import glslify from 'rollup-plugin-glslify'

export default {
  input: 'src/index.ts',
  output: [{ file: 'dist/bundle.js', format: 'iife' }],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    json(),
    typescript({
      useTsconfigDeclarationDir: true,
      declarationDir: 'dist/src',
    }),
    css(),
    commonjs(),
    nodeResolve(),
    sourcemaps(),
    copy({
      targets: [{ src: `index.html`, dest: `dist` }],
    }),
    glslify(),
  ],
}
