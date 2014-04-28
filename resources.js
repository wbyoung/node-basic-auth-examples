'use strict';

module.exports = function(auth) {
  return {
    unprotected: function(req, res) {
      res.json({ data: 'unprotected resource' });
    },

    protected: auth.protect(function(req, res) {
      res.json({ data: 'protected resource' });
    })
  };
};
