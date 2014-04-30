'use strict';

/**
 * Cookie Token Middleware
 *
 * Clients send and receive tokens via cookies.
 *
 * This middleware does the following:
 *
 *  - `req.token` is set to the value of the signed `auth-token` cookie
 *  - `res.token` is set to a function that takes a token argument. When
 *     called, the `auth-token` and `auth-authorized` cookies will be set.
 *     `auth-token` is signed and HTTP only containing the token value.
 *     `auth-authorized` will be a truthful value.
 */
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
