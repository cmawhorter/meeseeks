'use strict';

var jwt = require('jsonwebtoken');

var auth = module.exports = {
  verify: function(id_token, signingToken, decodeOnly) {
    var decoded;
    if (decodeOnly) {
      decoded = jwt.decode(id_token);
    }
    else {
      decoded = jwt.verify(id_token, signingToken);
    }
    return decoded;
  },
}
