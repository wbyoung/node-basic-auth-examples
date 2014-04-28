'use strict';

var users = require('../users');
var utils = require('../utils');
var db = require('../db');
var q = require('q');

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
        res.json({ username: user.username, token: token });
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
      res.json({ username: user.username, token: token });
    })
    .fail(function(e) { res.json(401, { error: 'credentials invalid' }); })
    .done();
  },

  signout: function(req, res) {
    var user = null;
    var token = req.get('auth-token');

    q()
    .then(function() { return db.find({ 'token_digest': utils.digest(token) }); })
    .then(function(_user) { return (user = _user); })
    .then(function(user) { return users.refreshToken(user); }) // refresh token for good measure
    .then(function() { return db.save(user.id, user); })
    .then(function() { res.json({ success: true, token: null }); })
    .fail(function() { res.json({ success: true, token: null }); }) // ignore errors
    .done();
  }

};

exports.protect = function(fn) {
  return function(req, res) {
    var token = req.get('auth-token');
    var query = function() {
      return { 'token_digest': utils.digest(token) };
    };

    q()
    .then(function() { return db.find(query()); })
    .then(function() { fn(req, res); })
    .fail(function() { res.json(401, { error: 'not authorized' }); })
    .done();
  };
};
