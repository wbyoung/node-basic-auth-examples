'use strict';

var _ = require('lodash');
var q = require('q');
var storage = {}; // all objects are stored in memory rather than using an actual database

var match = function(object, query) {
  return _.every(query, function(value, key) {
    return object[key] === value;
  });
};

var promise = function(object) {
  return object ? q(object) : q.reject(new Error('not found'));
};

exports.save = function(id, object) {
  return promise(storage[id] = object);
};

exports.get = function(id) {
  return promise(storage[id]);
};

exports.find = function(query) {
  return promise(_.find(storage, function(object, key) {
    return match(object, query);
  }));
};

exports.reset = function() {
  return (storage = {}) && q(true);
};
