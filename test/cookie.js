/* jshint expr: true */
/* global before, beforeEach, after */

'use strict';

var User = require('../lib/models/user');
var db = require('../lib/db');

var q = require('q');
var util = require('util');
var chai = require('chai');
var expect = chai.expect;

var server;
var get, post, _request;
var port = 383273;
var baseURL = util.format('http://localhost:%d/api', port);

describe('cookie auth', function() {
  beforeEach(function(done) { db.reset().then(function() { done(); }); });
  beforeEach(function() { var r = _request(); get = r.get; post = r.post; });
  before(function(done) {
    var app = require('..')('cookie');
    app.get('/api/cookie-reading-url', function(req, res) {
      res.json({ signed: req.signedCookies, unsigned: req.cookies });
    });
    server = app.listen(port, done);
  });
  after(function(done) {
    server.close(done);
  });

  it('creates new users', function(done) {
    var params = { email: 'user@wbyoung.github.io', password: 'password' };
    post({ url: baseURL + '/users', json: params })
    .spread(function(res, body) {
      expect(Object.keys(body).length).to.eql(1);
      expect(body.username).to.eql(params.email);
    })
    .then(done).done();
  });

  it('sets cookies', function(done) {
    post({ url: baseURL + '/users', json: {
      email: 'user@wbyoung.github.io',
      password: 'password'
    }})
    .spread(function(res, body) {
      return get({ url: baseURL + '/cookie-reading-url' });
    })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(body.signed['auth-id']).to.match(/[0-9a-z\-]{36}/);
    })
    .then(done).done();
  });

  it('authenticates users', function(done) {
    var params;
    User.create('someone', 'password')
    .then(function(user) {
      params = { email: user.username, password: 'password' };
      return post({ url: baseURL + '/sessions', json: params });
    })
    .spread(function(res, body) {
      expect(Object.keys(body).length).to.eql(1);
      expect(body.username).to.eql(params.email);
    })
    .then(done).done();
  });
});

_request = exports.request = function() {
  var req = require('request');
  req = req.defaults({ jar: req.jar() });
  return {
    get: q.denodeify(req.get),
    post: q.denodeify(req.post)
  };
};
