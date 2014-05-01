'use strict';

var User = require('./models/user');
var express = require('express');
var utils = require('./utils');
var q = require('q');

/**
 * Authentication Routes
 *
 * Routes for user management.
 * They require token and user middleware to be installed.
 */
var routes = exports.routes = {

  users: {
    create: function(req, res) {
      var user = null;
      var token = null;
      var params = req.body;

      q()
      .then(function() { return User.find({ username: params.email }); })
      .then(function() { res.json(401, { error: 'username taken' }); })
      .fail(function() {
        q()
        .then(function() { return User.build(params.email, params.password); })
        .then(function(_user) { user = _user; })
        .then(function() { return res.auth.remember(user); })
        .then(function() { return user.save(); })
        .then(function() { res.json({ username: user.username }); })
        .done();
      })
      .done();
    }
  },

  sessions: {
    create: function(req, res) {
      var user = null;
      var token = null;
      var params = req.body;

      q()
      .then(function() { return User.find({ username: params.email }); })
      .then(function(_user) { user = _user; })
      .then(function() { return user.authenticate(params.password); })
      .then(function() { return res.auth.remember(user); })
      .then(function() { return user.save(); }) // in case user was changed
      .then(function() { res.json({ username: user.username }); })
      .fail(function(e) { res.json(401, { error: 'credentials invalid' }); })
      .done();
    },

    destroy: function(req, res) {
      q()
      .then(function() { return res.auth.clear(req.user); })
      .then(function() { return req.user && req.user.save(); }) // in case user was changed
      .then(function() { res.json({ success: true }); })
      .fail(function() { res.json({ success: true }); }) // ignore errors
      .done();
    }
  }

};


/**
 * Authentication Router
 *
 * Router for user management.
 * Default routing setup for exposed routes.
 */
var router = exports.router = express.Router();
router.post('/users', routes.users.create);
router.post('/sessions', routes.sessions.create);
router.delete('/sessions', routes.sessions.destroy);


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
    .then(function() { return User.find(req.auth.query); })
    .then(function(user) { req.user = user; next(); })
    .fail(function() { next(); })
    .done();
  };
};
