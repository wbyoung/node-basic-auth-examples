/* jshint expr: true */
/* global before, beforeEach, after */

'use strict';

var User = require('../lib/models/user');
var db = require('../lib/db');

var q = require('q');
var util = require('util');
var chai = require('chai');
var expect = chai.expect;

var server = null;
var get, post, _request;
var port = 383273;
var baseURL = util.format('http://localhost:%d/api', port);

describe('token auth', function() {
  beforeEach(function(done) { db.reset().then(function() { done(); }); });
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
    post({ url: baseURL + '/users', json: params })
    .spread(function(res, body) {
      expect(Object.keys(body).length).to.eql(1);
      expect(body.username).to.eql(params.email);
      expect(res.headers['auth-token']).to.match(/[0-9a-z]{16}/);
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
      expect(res.headers['auth-token']).to.match(/[0-9a-z]{16}/);
    })
    .then(done).done();
  });

  it('invalidates tokens on signout', function(done) {
    var params;
    var token;

    User.create('someone', 'password')
    .then(function(user) {
      params = { email: user.username, password: 'password' };
      return post({ url: baseURL + '/sessions', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      token = res.headers['auth-token']; // capture token for use later
      return post({ url: baseURL + '/sessions', json: { _method: 'delete' } });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      expect(res.headers['auth-token-invalidated']).to.eql('true');
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
    post({ url: baseURL + '/sessions', json: { _method: 'delete' } })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      expect(res.headers['auth-token-invalidated']).to.eql('true');
    }).then(done).done();
  });

  it('can handle multiple sessions simultaneously', function(done) {
    var params;
    var token1 = null;
    var token2 = null;

    User.create('someone', 'password')
    .then(function(user) {
      params = { email: user.username, password: 'password' };
      return post({ url: baseURL + '/sessions', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      token1 = res.headers['auth-token']; // capture token for use later
      return post({ url: baseURL + '/sessions', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      token2 = res.headers['auth-token']; // capture token for use later
      return post({ url: baseURL + '/sessions', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token1 }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token2 }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token2 }; // custom headers to re-use token
      return post({ url: baseURL + '/sessions', json: { _method: 'delete' }, headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token2 }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      var headers = { 'auth-token': token1 }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token1 }; // custom headers to re-use token
      return post({ url: baseURL + '/sessions', json: { _method: 'delete' }, headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      var headers = { 'auth-token': token1 }; // custom headers to re-use token
      return get({ url: baseURL + '/protected', headers: headers });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
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
        authToken = res.headers['auth-token'];
        if (res.headers['auth-token-invalidated']) {
          authToken = null;
        }
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
