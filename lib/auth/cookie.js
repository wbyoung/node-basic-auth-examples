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
        res.cookie('auth-token', token, { signed: true });
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
      res.cookie('auth-token', token, { signed: true });
      res.json({ username: user.username });
    })
    .fail(function(e) { res.json(401, { error: 'credentials invalid' }); })
    .done();
  },

  signout: function(req, res) {
    res.clearCookie('auth-token');
    res.json({ success: true });
  }

};

exports.protect = function(fn) {
  return function(req, res) {
    var token = req.signedCookies['auth-token'];
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
