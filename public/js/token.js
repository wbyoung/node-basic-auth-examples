/* global window, localStorage, jQuery, $, _ */

'use strict';

(function(window) {
  var store = {
    get: function(key) {
      return localStorage.getItem(key);
    },
    set: function(key, value) {
      if (value) { localStorage.setItem(key, value); }
      else { localStorage.removeItem(key); }
    }
  };


  /**
   * Application.auth methods.
   */
  _.merge(window, { Application: { auth: {
    authenticated: function() {
      return !!store.get('auth-token');
    },

    login: function(data) {
      store.set('auth-username', data.username);
      store.set('auth-token', data.token);
    },

    username: function() {
      return store.get('auth-username');
    }
  }}});


  /**
   * Add authentication token to all ajax requests.
   */
  $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    var token = store.get('auth-token');
    if (token) {
      options.beforeSend = (function(orig) {
        return function(xhr) {
          xhr.setRequestHeader('auth-token', token);
          return orig.apply(this, arguments);
        };
      })(options.beforeSend || function() {});
    }
  });


})(window);
