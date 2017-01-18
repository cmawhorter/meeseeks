
// https://github.com/rollup/rollup/wiki/Command-Line-Interface#using-a-config-file

import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

const IS_DEV = process.env.NODE_ENV === 'development';

const Config = require(`./env-${process.env.NODE_ENV}.json`);

export default {
  entry: 'src/main.js',
  sourceMap: true,
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
    }),
    replace({
      ENV: JSON.stringify(Config),
    }),
  ],
  targets: [
    { dest: 'dist/track.umd.js', format: 'umd', moduleName: 'StamprTrack' },
    { dest: 'dist/track.es2015.js', format: 'es' },
    { dest: 'dist/track.js',
      format: 'iife',
      moduleName: 'StamprTrack',
    },
  ],
};
