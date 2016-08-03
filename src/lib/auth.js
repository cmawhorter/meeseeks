'use strict';

var jwt = require('jsonwebtoken');

var auth = module.exports = {
  verify: function(signingToken, id_token) {
    var decoded;
    if (IS_DEV) {
      decoded = jwt.decode(id_token);
    }
    else {
      decoded = jwt.verify(id_token, signingToken);
    }
    return decoded;
  },
}
