'use strict';

var express = require('express');
var path = require('path');

var create = module.exports = function(authType) {
  var app = express();
  var auth = require('./lib/auth');
  var resources = require('./resources');

  app.set('view engine', 'hbs');
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(require('body-parser')());
  app.use(require('method-override')());
  app.use(require('cookie-parser')('your secret here'));
  app.use(auth.middleware[authType]());
  app.use(auth.middleware.user());

  var api = express.Router();
  api.use(auth.router);
  api.get('/unprotected', resources.unprotected);
  api.get('/protected', resources.protected);

  app.use('/api', api);
  app.get('/', function(req, res) {
    res.render('index', { type: authType });
  });

  return app;
};

if (require.main === module) {
  var port = process.env.PORT || 3000;
  var auth = (process.env.AUTH || 'token').toLowerCase();

  create(auth).listen(port, function() {
    console.log('Express server started on port %s using %s auth', port, auth);
  });
}
