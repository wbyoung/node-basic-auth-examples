'use strict';

/**
 * Token Middleware
 *
 * Clients send tokens via HTTP headers and receive them via JSON.
 *
 * This middleware does the following:
 *
 *  - `req.token` is set to the value of the `auth-token` HTTP header
 *  - `res.token` is set to a function that takes a token argument. When
 *     called, the `res.json` method will be decorated so that `token` will
 *     always be set on the resulting JSON object.
 */
module.exports = function() {
  return function(req, res, next) {
    req.auth = {
      token: req.get('auth-token')
    };
    res.auth = {
      token: function(value) {
        res.json = (function(orig) {
          return function() {
            var args = Array.prototype.slice.call(arguments);
            var obj = args.pop();
            obj.token = value;
            args.push(obj);
            return orig.apply(this, args);
          };
        })(res.json);
      }
    };
    next();
  };
};
