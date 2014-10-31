'use strict';

var App = Ember.Application.create();

App.AdmitOneContainers = {};
Ember.AdmitOne.setup({ containers: App.AdmitOneContainers });

App.Router.map(function() {
  this.route('cityhackers');
  this.route('signup');
  this.route('login');
  this.route('logout');
  this.route('profile');
  this.route('gmapAPI');

});

App.Router.reopen({
  location: 'history'
});

App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: 'api'
});

App.ProfileRoute = Ember.Route.extend(Ember.AdmitOne.AuthenticatedRouteMixin, {
  model: function() {
    // TODO: is this really the right place to do this?
    // whit put some doubt in what he said about this.
    App._findGmapLocation();
    // TODO: we don't always want the user with id 1
    return this.store.find('user', 1);
 //   return {};
  }
});


App.ProfileController = Ember.ObjectController.extend({
  actions: {
    addVisibleName: function() {
      var self = this;

      this.set('error', undefined);
      this.get('model').save() // change the visible name to input
      .then(function() {
        // still need to figure out if anything is going to happen here.
      })
      .catch(function(error) {
        if (error.responseJSON) { error = error.responseJSON; }
        if (error.error) { error = error.error; }
        self.set('error', error);
      });
    }
  }
});


App.User = DS.Model.extend({
  interests: DS.attr('string'),
  location_latitude: DS.attr('string'),
  location_longitude: DS.attr('string'),
  picture: DS.attr('string'),
  user_email: DS.attr('string'),
  username: DS.attr('string'),
  password: DS.attr('string'),
  visibleName: DS.attr('string')
});

App.LoginRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    if (this.get('session').get('isAuthenticated')) {
      this.transitionTo('profile');
    }
  }
});

App.LoginController = Ember.Controller.extend({
  actions: {
    authenticate: function() {
      var self = this;
      var session = this.get('session');
      var credentials = this.getProperties('username', 'password');
      this.set('error', undefined);
      this.set('password', undefined);
      session.authenticate(credentials).then(function() {
        var attemptedTransition = self.get('attemptedTransition');
        if (attemptedTransition) {
          attemptedTransition.retry();
          self.set('attemptedTransition', null);
        } else {
          self.transitionToRoute('profile');
        }
      })
      .catch(function(error) {
        self.set('error', error);
      });
    }
  }
});

App.LogoutRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    var self = this;
    var session = this.get('session');
    return session.invalidate().finally(function() {
      self.transitionTo('index');
    });
  }
});

App.SignupRoute = Ember.Route.extend({
  model: function() {
    return this.store.createRecord('user');
  }
});

App.SignupController = Ember.ObjectController.extend({
  actions: {
    signup: function() {
      var session = this.get('session');
      var self = this;

      this.set('error', undefined);
      this.get('model').save() // create the user
      .then(function() {
        session.login({ username: self.get('model.username') });
        self.transitionToRoute('profile');
      })
      .catch(function(error) {
        if (error.responseJSON) { error = error.responseJSON; }
        if (error.error) { error = error.error; }
        self.set('error', error);
      });
    }
  }
});

App._findGmapLocation = function() {
  console.log('Finding location via "browser method"...');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log('Latitude: ' + position.coords.latitude +
      ', Longitude: ' + position.coords.longitude);
    });
  } else {
    console.log('Geolocation is not supported by this browser.');
  }
};

//potentially plug the api in here to access the lat long object



App._doSomethingWithPosition = function(lat, lng) {
  console.log('Will do something else...');
  console.log(lat, lng);
};

// expose App globally
window.App = App;
