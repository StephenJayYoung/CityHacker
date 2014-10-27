'use strict';

Ember.Application.initializer({
  name: 'authentication-test',
  initialize: function(container, application) {
    var Ephemeral = Ember.AdmitOne.Storage.Base.extend({
      data: null,
      persist: function(data) { this.set('data', data); },
      restore: function() { return this.get('data'); },
      clear: function() { this.set('data'); }
    });
    application.register('auth-session-storage:ephemeral', Ephemeral);
    application.register('auth-session-storage:test', Ephemeral);
    App.AdmitOneContainers.storage = 'auth-session-storage:test';
  }
});

Ember.Test.registerHelper('applicationContainer', function(app) {
  return app.__container__;
});

Ember.LOG_VERSION = false;
Ember.testing = true;
Ember.Application.reopen({
  init: function() {
    this._super();
    this._setupTestApplication();
  },

  _setupTestApplication: function() {
    var testingElementID = 'ember-test-application';
    this.rootElement = '#' + testingElementID;
    this.setupForTesting();
    this.injectTestHelpers();
    Ember.$('body').append(Ember.$('<div id="' + testingElementID + '"/>'));
  }
});


// expose fixtures property (stored in __html__ via karma preprocessor)
window.__fixture = function(name) {
  var fixture = window.__html__['test/fixtures/' + name + '.json'];
  if (!fixture) { throw new Error('Missing fixture ' + name); }
  return JSON.parse(fixture);
};

// This is a hack until phantomjs#10522 is fixed
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
