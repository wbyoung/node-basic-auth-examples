'use strict';

var auth = require('./lib/auth');

module.exports = {
  unprotected: function(req, res) {
    res.json({ data: 'unprotected resource' });
  },

  protected: auth.protect(function(req, res) {
    res.json({ data: 'protected resource' });
  })
};
