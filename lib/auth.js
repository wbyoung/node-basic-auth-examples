'use strict';

var users = require('./users');
var utils = require('./utils');
var db = require('./db');
var q = require('q');

/**
 * Authentication Routes
 *
 * Routes for user management.
 * They require token and user middleware to be installed.
 */
exports.routes = {

  createUser: function(req, res) {
    var user = null;
    var token = null;
    var params = req.body;

    q()
    .then(function() { return db.find({ username: params.email }); })
    .then(function() { res.json(401, { error: 'username taken' }); })
    .fail(function() {
      q()
      .then(function() { return users.build(params.email, params.password); })
      .then(function(_user) { user = _user; })
      .then(function() { return users.refreshToken(user); })
      .then(function(_token) { token = _token; })
      .then(function() { return db.save(user.id, user); })
      .then(function() {
        res.auth.token(token);
        res.json({ username: user.username });
      })
      .done();
    })
    .done();
  },

  signin: function(req, res) {
    var user = null;
    var token = null;
    var params = req.body;

    q()
    .then(function() { return db.find({ username: params.email }); })
    .then(function(_user) { user = _user; })
    .then(function() { return users.authenticate(user, params.password); })
    .then(function() { return users.refreshToken(user); })
    .then(function(_token) { token = _token; })
    .then(function() { return db.save(user.id, user); })
    .then(function() {
      res.auth.token(token);
      res.json({ username: user.username });
    })
    .fail(function(e) { res.json(401, { error: 'credentials invalid' }); })
    .done();
  },

  signout: function(req, res) {
    var user = req.user;
    var signout = function() {
      res.auth.token(null);
      res.json({ success: true });
    };

    q()
    .then(function() { return users.refreshToken(user); }) // refresh token for good measure
    .then(function() { return db.save(user.id, user); })
    .then(signout)
    .fail(signout) // ignore errors
    .done();
  }

};


/**
 * Protection Wrapper
 *
 * Wraps a route to ensure that a user is signed in.
 * Requires user middleware to be installed.
 */
exports.protect = function(fn) {
  return function(req, res) {
    if (req.user) { fn(req, res); }
    else { res.json(401, { error: 'not authorized' }); }
  };
};


/**
 * Token Middleware Types
 *
 * See each individual module for additional documentation.
 */
exports.middleware = {};
exports.middleware.cookie = require('./auth/types/cookie');
exports.middleware.token = require('./auth/types/token');


/**
 * User Middleware
 *
 * Sets the user on the request.
 * Requires token middleware to be installed before this middleware.
 */
exports.middleware.user = function() {
  return function(req, res, next) {
    q()
    .then(function() {
      return db.find({ 'token_digest': utils.digest(req.auth.token) });
    })
    .then(function(user) { req.user = user; next(); })
    .fail(function() { next(); })
    .done();
  };
};
