'use strict';

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
