/* global window, localStorage, jQuery, $, _ */

'use strict';

(function(window) {
  var store = window.applicationStorage = {
    get: function(key) {
      return localStorage.getItem(key);
    },
    set: function(key, value) {
      if (value === undefined) { localStorage.removeItem(key); }
      else { localStorage.setItem(key, value); }
    }
  };

  /**
   * Handle authentication token for all incoming and outgoing ajax requests.
   * Store the token when we receive it, and send it in all future requests.
   * Clear the token when it's invalidated.
   */
  $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    var token = store.get('auth-token');
    if (token) {
      options.beforeSend = (function(beforeSend) {
        return function(xhr) {
          xhr.setRequestHeader('auth-token', token);
          return beforeSend.apply(this, arguments);
        };
      })(options.beforeSend || function() {});
    }

    options.success = options.success || [];
    options.success = $.isArray(options.success) ? options.success : [options.success];
    options.success.push(function(data, status, jqResponseXHR) {
      var token = jqResponseXHR.getResponseHeader('auth-token');
      var invalidated = jqResponseXHR.getResponseHeader('auth-token-invalidated');
      if (invalidated) {
        store.set('auth-authorized', undefined);
        store.set('auth-token', undefined);
      }
      else if (token) {
        store.set('auth-authorized', true);
        store.set('auth-token', token);
      }
    });
  });

})(window);
