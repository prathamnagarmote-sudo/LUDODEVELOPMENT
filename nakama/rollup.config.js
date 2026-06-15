import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './main.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    name: 'nakama_module'
  },
  plugins: [
    resolve(),
    commonJS(),
    typescript()
  ]
};
