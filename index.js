'use strict';

var express = require('express');
var path = require('path');

var create = module.exports = function(auth) {
  var app = express();
  var resources = require('./resources')(auth);

  app.use(express.static(path.join(__dirname, 'public')))
  app.use(require('body-parser')());
  app.use(require('cookie-parser')('your secret here'));

  app.post('/users/create', auth.routes.createUser);
  app.post('/users/signin', auth.routes.signin);
  app.post('/users/signout', auth.routes.signout);

  app.get('/unprotected', resources.unprotected);
  app.get('/protected', resources.protected);

  return app;
};

if (require.main === module) {
  var port = process.env.PORT || 3000;
  var authName = process.env.AUTH || 'token';
  var auth = require('./lib/auth/' + authName.toLowerCase());

  create(auth).listen(port, function() {
    console.log('Express server started on port %s using %s auth', port, authName);
  });
}
