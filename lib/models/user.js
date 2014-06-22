'use strict';

var uuid = require('node-uuid');
var bcrypt = require('bcrypt');
var db = require('../db');
var q = require('q');
var _ = require('lodash');

var _pwd = 'password_digest';

function User(username, password) {
  this.username = username;
  this.password = password;
}

User.build = function(username, password) {
  var user = new User(username, null);
  user.id = uuid.v4();
  return q()
  .then(function() { return q.nfcall(bcrypt.hash, password, 1); })
  .then(function(hash) { user[_pwd] = hash; return user; });
};

User.create = function() {
  return this.build.apply(this, arguments)
  .then(function(user) { return user.save(); });
};

User.find = function(query) {
  return q()
  .then(function() { return db.find('users', query); })
  .then(function(obj) { return User._resurrect(obj); });
};

User._resurrect = function(properties) {
  return _.extend(new User(), properties);
};

User.prototype.save = function() {
  return db.save('users', this.id, this);
};

User.prototype.authenticate = function(password) {
  var compare = q.denodeify(bcrypt.compare);
  var self = this;

  return q()
  .then(function() { return compare(password, self[_pwd]); })
  .then(function(result) {
    if (!result) { throw new Error('authentication failed'); }
  });
};

module.exports = User;
