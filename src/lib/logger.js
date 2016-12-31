'use strict';

var bunyan = require('bunyan');

module.exports = function(config) {
  config = config || {};
  var log = bunyan.createLogger({
      name: config.name || 'meeseeks',
      stream: process.stdout,
      level: config.logLevel
  });
  return log;
};
