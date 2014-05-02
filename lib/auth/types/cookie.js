'use strict';

/**
 * Cookie Middleware
 *
 * Clients send and receive user id via signed cookies.
 *
 * This middleware sets the following:
 *
 *  - `req.auth.user.id` is set to the user id for the authenticated user.
 *  - `res.auth.remember` - a function that sets cookies for remembering the
 *    user. It sets the following cookies:
 *    `auth-id` is signed and HTTP only containing the user's identifier.
 *    `auth-authorized` is some truthful value.
 *  - `res.auth.clear` - a function will clear all authentication related
 *    values for future requests.
 */
module.exports = function() {
  return function(req, res, next) {
    req.auth = {
      user: { id: req.signedCookies['auth-id'] }
    };
    res.auth = {
      remember: function(user) {
        res.cookie('auth-id', user.id, { signed: true, httpOnly: true });
        res.cookie('auth-authorized', 'true');
      },
      clear: function() {
        res.clearCookie('auth-id');
        res.clearCookie('auth-authorized');
      }
    };
    next();
  };
};
