'use strict';

var express = require('express');
var path = require('path');

var create = module.exports = function(authType) {
  var app = express();
  var auth = require('./lib/auth');
  var resources = require('./resources');

  app.use(express.static(path.join(__dirname, 'public')))
  app.use(require('body-parser')());
  app.use(require('cookie-parser')('your secret here'));
  app.use(auth.middleware[authType]());

  app.post('/users/create', auth.routes.createUser);
  app.post('/users/signin', auth.routes.signin);
  app.post('/users/signout', auth.routes.signout);

  app.get('/unprotected', resources.unprotected);
  app.get('/protected', resources.protected);

  return app;
};

if (require.main === module) {
  var port = process.env.PORT || 3000;
  var auth = (process.env.AUTH || 'token').toLowerCase();

  create(auth).listen(port, function() {
    console.log('Express server started on port %s using %s auth', port, auth);
  });
}
