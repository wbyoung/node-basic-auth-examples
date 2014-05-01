/* global window, document, _ */

'use strict';

(function(window) {
  window.applicationStorage = {
    get: function(key) {
      return _(document.cookie.split(';'))
      .map(function(pair) {
        return pair.trim().split('=');
      })
      .reduce(function(obj, pair) {
        obj[pair[0]] = pair[1];
        return obj;
      }, {})[key];
    },
    set: function(key, value) {
      document.cookie = key + '=' + value;
    }
  };
})(window);
