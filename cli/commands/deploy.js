'use strict';

const async      = require('async');
const deepAssign = require('deep-assign');
const buildCmd   = require('./build.js');
const updateCmd  = require('./update.js');

exports.command = 'deploy';
exports.desc    = 'Runs build and update in succession';
exports.builder = deepAssign({}, buildCmd.builder, updateCmd.builder);
exports.handler = function(argv) {
  async.waterfall({
    build:  (next) => buildCmd.handler(argv).then(next, next),
    update: (next) => updateCmd.handler(argv).then(next, next),
  }, (err) => console.log('Completed', err ? ' with error ' : '', err ? err.stack : null));
};
