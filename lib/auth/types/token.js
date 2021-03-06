'use strict';

var uuid = require('node-uuid');
var crypto = require('crypto');
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
    var digest = token &&
      crypto.createHash('sha1').update(token).digest('hex');

    var setup = function() {
      req.auth = {
        user: { id: id },
        token: token
      };
      res.auth = {
        remember: function(user) {
          // TODO: tokens could be forged without some sort of signature.
          // while they may be hard to guess since they're generated from
          // secure random input (uuid.v4), there's still nothing preventing
          // blind guessing. consider adding HMAC or some other MAC signature
          // or using something like JWT.
          token = uuid.v4().replace(/-/g, '');
          digest = crypto.createHash('sha1').update(token).digest('hex');
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
