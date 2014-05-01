'use strict';

var utils = require('../../utils');
var q = require('q');

var _tkd = 'token_digest';

/**
 * Token Middleware
 *
 * Clients send tokens via HTTP headers and receive them via JSON.
 *
 * This middleware does the following:
 *
 *  - `req.auth.token` is set to the value of the `auth-token` HTTP header.
 *  - `req.auth.userQuery` is set to a query that will find the authenticated
 *    user
 *  - `res.auth.remember` - a function that creates a token for remembering a
 *    user and and adds it to the HTTP headers. When called, the user will have
 *    an additional property, `token_digest`, set, and the HTTP response header
 *    will include `auth-token` for the client to use to make authenticated
 *    requests.
 *  - `res.auth.clear` - a function will clear all authentication related
 *     values for future requests. It does so by setting a HTTP response
 *     header, `auth-token-invalidated`, indicating that the client should
 *     clear stored token values no longer make authenticated requests. This
 *     may update the user's `token_digest` as well.
 */
module.exports = function() {
  return function(req, res, next) {
    var token = req.get('auth-token');
    var digest = token && utils.digest(token);
    req.auth = {
      token: token,
      userQuery: { 'token_digest': digest }
    };
    res.auth = {
      remember: function(user) {
        token = utils.guid().replace(/-/g, '');
        digest = utils.digest(token);
        user[_tkd] = digest;
        res.auth.token = token;
        res.setHeader('auth-token', token);
      },
      clear: function(user) {
        user = user || {}; // user not required
        token = null;
        digest = utils.digest(utils.guid()); // limit impact of hijacking
        user[_tkd] = digest;
        res.auth.token = token;
        res.setHeader('auth-token-invalidated', 'true');
      }
    };

    next();
  };
};
