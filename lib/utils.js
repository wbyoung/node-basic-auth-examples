'use strict';

var crypto = require('crypto');
var bcrypt = require('bcrypt');

var guid = exports.guid = function() {
  /* jshint bitwise: false */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var digest = exports.digest = function(data) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};
