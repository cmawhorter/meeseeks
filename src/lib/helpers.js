'use strict';

var helpers = module.exports = {
  now: function() {
    return new Date().toISOString();
  },

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
  deepFreeze: function(obj) {
    // Retrieve the property names defined on obj
    var propNames = Object.getOwnPropertyNames(obj);

    // Freeze properties before freezing self
    propNames.forEach(function(name) {
      var prop = obj[name];

      // Freeze prop if it is an object
      if (typeof prop == 'object' && prop !== null)
        helpers.deepFreeze(prop);
    });

    // Freeze self (no-op if already frozen)
    return Object.freeze(obj);
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
