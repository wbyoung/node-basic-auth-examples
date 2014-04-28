'use strict';

var utils = require('./utils');
var bcrypt = require('bcrypt');
var db = require('./db');
var q = require('q');

var keys = {
  passwordDigest: 'password_digest',
  tokenDigest: 'token_digest'
};

exports.build = function(username, password) {
  var args = Array.prototype.slice.call(arguments);
  var cb = (args.length > 2) ? args.pop() : function() {};
  var user = {
    'id': utils.guid(),
    'username': username,
  };
  return q()
  .then(function() { return q.nfcall(bcrypt.hash, password, 1); })
  .then(function(hash) { user[keys.passwordDigest] = hash; return user; });
};

exports.create = function() {
  var args = Array.prototype.slice.call(arguments);
  var user = null;
  return this.build.apply(this, args)
  .then(function(_user) { user = _user; })
  .then(function() { return db.save(user.id, user); })
  .then(function() { return user; });
};

exports.refreshToken = function(user) {
  var args = Array.prototype.slice.call(arguments);
  var token = utils.guid().replace(/-/g, '');
  user[keys.tokenDigest] = utils.digest(token);
  return q(token);
};

exports.authenticate = function(user, password) {
  var compare = q.denodeify(bcrypt.compare);

  return q()
  .then(function() { return compare(password, user[keys.passwordDigest]); })
  .then(function(result) {
    if (!result) { throw new Error('authentication failed'); }
  });
};
