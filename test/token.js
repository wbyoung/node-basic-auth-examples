/* jshint expr: true */
/* global before, beforeEach, after */

'use strict';

var users = require('../lib/users');
var db = require('../lib/db');
var q = require('q');
var util = require('util');
var chai = require('chai');
var expect = chai.expect;

var server = null;
var get, post, _request;
var port = 383273;
var baseURL = util.format('http://localhost:%d', port);

describe('token auth', function() {
  beforeEach(function(done) { db.reset().then(function() { done() }); });
  beforeEach(function() { var r = _request(); get = r.get; post = r.post; });
  before(function(done) {
    var app = require('..')('token');
    server = app.listen(port, done);
  });
  after(function(done) {
    server.close(done);
  });

  it('creates new users', function(done) {
    var params = {
      email: 'user@wbyoung.github.io',
      password: 'password'
    };
    post({ url: baseURL + '/users/create', json: params })
    .spread(function(res, body) {
      expect(Object.keys(body).length).to.eql(2);
      expect(body.username).to.eql(params.email);
      expect(body.token).to.match(/[0-9a-z]{16}/);
    })
    .then(done).done();
  });

  it('authenticates users', function(done) {
    var params;
    users.create('someone', 'password')
    .then(function(user) {
      params = { email: user.username, password: 'password' };
      return post({ url: baseURL + '/users/signin', json: params });
    })
    .spread(function(res, body) {
      expect(Object.keys(body).length).to.eql(2);
      expect(body.username).to.eql(params.email);
      expect(body.token).to.match(/[0-9a-z]{16}/);
    })
    .then(done).done();
  });

  it('invalidates tokens on signout', function(done) {
    var params;
    var token;

    users.create('someone', 'password')
    .then(function(user) {
      params = { email: user.username, password: 'password' };
      return post({ url: baseURL + '/users/signin', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      token = body.token; // capture token for use later
      return post({ url: baseURL + '/users/signout' });
    })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(res.statusCode).to.eql(200);
      expect(body.token).to.be.null;
      var headers = { 'auth-token': token }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      body = JSON.parse(body);
      expect(body).to.eql({ error: 'not authorized' });
    }).then(done).done();
  });

  it('signs out when token is not provided', function(done) {
    post({ url: baseURL + '/users/signout' })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(res.statusCode).to.eql(200);
      expect(body.token).to.be.null;
    }).then(done).done();
  });
});

// create a wrapper that acts just like the request module, but that will read
// the response store an auth token whenever the response body contains
// `token`. this auth token will then be set in all future requests (unless one
// has already been set).
_request = exports.request = function() {
  var authToken = null;
  var wrap = function(fn) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var cb = args.pop();
      var opts = args.pop();
      if (typeof opts === 'object') {
        opts.headers = opts.headers || {};
        opts.headers['auth-token'] = opts.headers['auth-token'] || authToken;
      }
      args.push(opts);
      args.push(function(error, res, body) {
        try {
          var json = body;
          if (typeof body === 'string') { json = JSON.parse(body); }
          if (json.token !== undefined) { authToken = json.token; }
        }
        catch (e) {}
        cb.call(this, error, res, body);
      });
      return fn.apply(this, args);
    };
  };

  var req = require('request');
  return {
    get: q.denodeify(wrap(req.get)),
    post: q.denodeify(wrap(req.post))
  };
};
