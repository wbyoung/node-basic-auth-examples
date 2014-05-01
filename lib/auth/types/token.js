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
 *  - `req.auth.token` is set to the value of the `auth-token` HTTP header
 *  - `req.auth.query` is set to a query that will find the authenticated user
 *  - `res.auth.remember` - a function that creates a token for remembering a
 *    user and ensure the response will include the token. When called, the
 *    user will have an additional property, `token_digest`, set, and the
 *    `res.json` method will be decorated so that `token` will always be set
 *    on the resulting JSON object.
 *  - `res.auth.clear` - a function will clear all authentication related
 *     values for future requests. This may update the user's `token_digest`
 *     and decorate `res.json` as well.
 */
module.exports = function() {
  var decorateJSON = function(json, token) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var obj = args.pop();
      obj.token = token;
      args.push(obj);
      return json.apply(this, args);
    };
  };

  return function(req, res, next) {
    var token = req.get('auth-token');
    var digest = token && utils.digest(token);
    req.auth = {
      token: token,
      query: { 'token_digest': digest }
    };
    res.auth = {
      remember: function(user) {
        token = utils.guid().replace(/-/g, '');
        digest = user[_tkd] = utils.digest(token);
        res.auth.token = token;
        res.json = decorateJSON(res.json, token);
      },
      clear: function(user) {
        // expire token/digest for good measure
        token = null;
        digest = (user || {})[_tkd] = 'expired';
        res.auth.token = token;
        res.json = decorateJSON(res.json, token);
      }
    };
    next();
  };
};
