'use strict';

var utils = require('../../utils');
var db = require('../../db');
var q = require('q');

/**
 * Token Middleware
 *
 * Clients send tokens via HTTP headers and receive them via JSON.
 *
 * This middleware does the following:
 *
 *  - `req.auth.user.id` is set to the user id for the authenticated user.
 *  - `req.auth.token` is set to the value of the `auth-token` HTTP header.
 *  - `res.auth.remember` - a function that creates a token for remembering a
 *    user and and adds it to the HTTP headers. When called, the `auth-token`
 *    HTTP response header will be added for the client to use to make
 *    authenticated requests. Session data will be persisted to the database.
 *    Returns a promise.
 *  - `res.auth.clear` - a function that will clear all authentication related
 *    values for future requests. It does so by setting a HTTP response
 *    header, `auth-token-invalidated`, indicating that the client should
 *    clear stored token values no longer make authenticated requests. Session
 *    data will be removed from the database.
 *    Returns a promise.
 */
module.exports = function() {
  return function(req, res, next) {
    var id = null;
    var token = req.get('auth-token');
    var digest = token && utils.digest(token);

    var setup = function() {
      req.auth = {
        user: { id: id },
        token: token
      };
      res.auth = {
        remember: function(user) {
          token = utils.guid().replace(/-/g, '');
          digest = utils.digest(token);
          res.auth.token = token;
          res.setHeader('auth-token', token);
          return db.save('sessions', digest, user.id);
        },
        clear: function(user) {
          token = null;
          res.auth.token = token;
          res.setHeader('auth-token-invalidated', 'true');
          return db.remove('sessions', digest);
        }
      };

      next();
    };

    q()
    .then(function() { return db.get('sessions', digest); })
    .then(function(_id) { id = _id; })
    .then(function() { setup(); })
    .fail(function() { setup(); })
    .done();
  };
};
