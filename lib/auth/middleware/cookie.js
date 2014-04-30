'use strict';

module.exports = function() {
  return function(req, res, next) {
    req.auth = {
      token: req.signedCookies['auth-token']
    };
    res.auth = {
      token: function(value) {
        if (value) {
          res.cookie('auth-token', value, { signed: true, httpOnly: true });
          res.cookie('auth-authorized', 'true');
        }
        else {
          res.clearCookie('auth-token');
          res.clearCookie('auth-authorized');
        }
      }
    };
    next();
  };
};
