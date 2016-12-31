'use strict';

var uuid = require('uuid');
var BaseX = require('base-x');

module.exports = function(config) {
  config = config || {};
  config.alphabet = config.alphabet || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  config.prefix = (config.prefix || 'req_') || '';
  var basex = BaseX(config.alphabet);
  return function() {
    var buffer = new Buffer(16);
    uuid.v4(null, buffer);
    return config.prefix + basex.encode(buffer);
  };
};
