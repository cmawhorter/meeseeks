'use strict';

var helpers = module.exports = {
  now: function() {
    return new Date().toISOString();
  },

  logLevelFromEnv: function() {
    switch (process.env.NODE_ENV) {
      case 'development':
        return 'trace';
      case 'testing':
      case 'staging':
        return 'debug';
      default:
      case 'production':
        return 'info';
    }
  },
};
