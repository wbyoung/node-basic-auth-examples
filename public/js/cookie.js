/* global window, document, _ */

'use strict';

(function(window) {
  var cookie = {
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


  /**
   * Application.auth methods.
   */
  _.merge(window, { Application: { auth: {
    authenticated: function() {
      return !!cookie.get('auth-authorized');
    },
    login: function(data) {
      cookie.set('auth-username', data.username);
    },
    username: function() {
      return cookie.get('auth-username');
    }
  }}});

})(window);
