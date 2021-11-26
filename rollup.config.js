import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

const sourcemap = true
const external = ['@zeainc/zea-engine', '@zeainc/zea-cad']

export default [
  // browser-friendly UMD build
  {
    input: 'src/TreeView.js',
    external,
    output: {
      name: 'zeaTreeView',
      file: pkg.browser,
      format: 'umd',
      sourcemap,
      globals: {
        '@zeainc/zea-engine': 'zeaEngine',
        '@zeainc/zea-cad': 'zeaCad',
      },
    },

    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/TreeView.js',
    external,
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
  },
]
