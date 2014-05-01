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
var get, post;
var port = 383273;
var baseURL = util.format('http://localhost:%d/api', port);

var shouldBehaveLikeAllAuthenticators = function() {
  beforeEach(function(done) { db.reset().then(function() { done(); }); });
  beforeEach(function() { var r = this.request(); get = r.get; post = r.post; });
  before(function(done) {
    server = require('..')(this.auth).listen(port, done);
  });
  after(function(done) {
    server.close(done);
  });

  it('automatically logs in new users', function(done) {
    post({ url: baseURL + '/users', json: {
      email: 'user@wbyoung.github.io',
      password: 'password'
    }})
    .spread(function(res, body) { return get({ url: baseURL + '/protected' }); })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(body).to.eql({ data: 'protected resource' });
    })
    .then(done).done();
  });

  it('does not allow creating user when one exists', function(done) {
    var params = { email: 'user@wbyoung.github.io', password: 'password' };
    User.create(params.email, params.password)
    .then(function(user) {
      return post({ url: baseURL + '/users', json: params });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      expect(body).to.eql({ error: 'username taken' });
    })
    .then(done).done();
  });

  it('does allows access to unproteced resource', function(done) {
    get({ url: baseURL + '/unprotected' })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(body).to.eql({ data: 'unprotected resource' });
    })
    .then(done).done();
  });

  it('restricts access to protected resource', function(done) {
    get({ url: baseURL + '/protected' })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      body = JSON.parse(body);
      expect(body).to.eql({ error: 'not authorized' });
    })
    .then(done).done();
  });

  it('authenticates users', function(done) {
    User.create('someone', 'password')
    .then(function(user) {
      return post({ url: baseURL + '/sessions', json: {
        email: user.username,
        password: 'password'
      }});
    })
    .spread(function(res, body) { return get({ url: baseURL + '/protected' }); })
    .spread(function(res, body) {
      body = JSON.parse(body);
      expect(body).to.eql({ data: 'protected resource' });
    })
    .then(done).done();
  });

  it('rejects invalid credentials', function(done) {
    User.create('someone', 'password')
    .then(function(user) {
      return post({ url: baseURL + '/sessions', json: {
        email: user.username,
        password: 'wrong'
      }});
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      expect(body).to.eql({ error: 'credentials invalid' });
    })
    .then(done).done();
  });

  it('signs out users', function(done) {
    User.create('user@somewhere.com', 'password')
    .then(function(user) {
      return post({ url: baseURL + '/sessions', json: {
        email: user.username,
        password: 'password'
      }});
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      return post({ url: baseURL + '/sessions', json: { _method: 'delete' } });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(200);
      expect(body.success).to.be.true;
      return get({ url: baseURL + '/protected' });
    })
    .spread(function(res, body) {
      expect(res.statusCode).to.eql(401);
      body = JSON.parse(body);
      expect(body).to.eql({ error: 'not authorized' });
    })
    .then(done).done();
  });
};

['cookie', 'token'].forEach(function(authName) {
  describe(authName + ' auth', function() {
    before(function() {
      this.auth = authName;
      this.request = require('./' + authName).request;
    });
    shouldBehaveLikeAllAuthenticators();
  });
});
