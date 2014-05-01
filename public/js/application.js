/* global window, jQuery, $, _ */

'use strict';

$(function() {
  /**
   * Authentication
   */
  var auth = _.extend({}, window.Application.auth, {
    protect: function(fn, message) {
      return function(e) {
        if (!auth.authenticated()) {
          window.location.hash = '/login';
          e.preventDefault();
          setTimeout(function() {
            error.display('Login Required', message ||
              'You must log in to access this page.');
          }, 0);
        }
        else { fn.apply(this, arguments); }
      };
    }
  });

  /**
   * General application logic.
   */
  var app = {
    setup: function() {
      app.updateComponents();
    },
    updateComponents: function() {
      var $auth = $('.auth-controls');
      var $noAuth = $('.login');
      if (auth.authenticated()) {
        $auth.show();
        $noAuth.hide();
      }
      else {
        $auth.hide();
        $noAuth.show();
        $('.request-data').text('');
      }
      $('.username').text(auth.username());
      $('.form-auth input').val('');
    },
    afterLogin: function() {
      app.updateComponents();
      window.location.hash = '/account';
    },
    afterLogout: function() {
      app.updateComponents();
      window.location.hash = '/home';
    }
  };
  app.setup();


  /**
   * Templates
   */
  var template = {
    render: function(templateName, data, $page) {
      var text = $('#' + templateName + '-template').text();
      var rendered = _.template(text, data);
      $page.find('.' + templateName + '-template-render').html(rendered);
    },
    ajax: function(templateName, resource, $page) {
      $.ajax(resource).success(function(data, status, xhr) {
        template.render(templateName, data, $page);
      })
      .error(error.handler('Resource Error'));
    }
  };


  /**
   * Error handling
   */
  var error = {
    display: function(title, details) {
      var $page = $('.page:visible');
      template.render('error', { title: title, message: details }, $page);
      $page.find('.error-template-render .alert').alert();
    },
    handler: function(title) {
      return function(xhr, status, e) {
        var message;
        try { message = JSON.parse(xhr.responseText).error; }
        catch (e) { }
        error.display(title, message || e);
      };
    },
    hide: function() {
      $('.page:visible .error-template-render .alert').hide();
    }
  };


  /**
   * Forms: login & signup
   */
  (function() {
    var forms = [
      { name: 'signin', action: '/api/sessions' },
      { name: 'signup', action: '/api/users' },
    ];
    _.forEach(forms, function(info) {
      var name = info.name;
      var action = info.action;
      var capitalized = name[0].toUpperCase() + name.slice(1);
      var $form = $('.form-' + name);
      $form.submit(function(e) {
        $.ajax(action, {
          method: 'post',
          data: $form.serializeArray()
        })
        .success(function(data, status, xhr) {
          auth.login(data);
          app.afterLogin();
        })
        .error(error.handler(capitalized + ' Error'));
        e.preventDefault();
      });
    });
  })();


  /**
   * Transitions
   */
  $(window).on('app:transition:account', auth.protect(function(e, $page) {
    template.ajax('account', '/api/protected', $page);
  }));

  $(window).on('app:transition:settings', auth.protect(function(e, $page) {
    template.ajax('settings', '/api/protected', $page);
  }));

  $(window).on('app:transition:contact', function(e, $page) {
    template.ajax('contact-1', '/api/protected', $page);
    template.ajax('contact-2', '/api/unprotected', $page);
  });

  $(window).on('app:transition:logout', function(e, $page) {
    $.ajax('/api/sessions', { method: 'post', data: { _method: 'delete' } })
    .success(function(data, status, xhr) {
      auth.login({});
      app.afterLogout();
    })
    .error(error.handler('Logout Error'));
    e.preventDefault(); // never show logout page
  });


  /**
   * Transitions: Implementation
   */
  (function() {
    var extract = function(url) {
      var match = url && url.match(/^#\/([\w\/\-]*)$/i);
      return match && match[1].replace(/[^a-z]+/ig, '-');
    };
    var change = function(fallback) {
      var name = extract(window.location.hash || fallback);
      var $pages = $('.page');
      var $page = name && $('.page.page-' + name);
      var transition = !!($page);

      if (transition) {
        var event = jQuery.Event('app:transition:' + name);
        $(window).trigger(event, [$page]);
        transition = !event.isDefaultPrevented();
      }

      if (transition) {
        error.hide();
        $pages.hide();
        $page.show();
      }
    };
    $(window).on('hashchange', function() {
      change();
    });
    change('#/home');
  })();
});
