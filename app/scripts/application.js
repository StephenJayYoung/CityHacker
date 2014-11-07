'use strict';

var App = Ember.Application.create();

App.AdmitOneContainers = {};
Ember.AdmitOne.setup({ containers: App.AdmitOneContainers });

App.Router.map(function() {
  this.route('users', { path: '/cityhackers' });
  this.route('signup');
  this.route('login');
  this.route('logout');
  this.route('profile');
  this.route('gmapAPI');
  this.route('picture');
});

App.Router.reopen({
  location: 'history'
});

App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: 'api'
});

App.ProfileRoute = Ember.Route.extend(Ember.AdmitOne.AuthenticatedRouteMixin, {
  model: function() {
    // TODO: Not sure this is where to do this?
    // whit put some doubt in what he said about this.
    // TODO: Kali and Whit took this out because it's currently not doing
    // anything and it's visually complex (a.k.a really annoying in Whit-speak)
    // in the test ouput.
    // App._findGmapLocation();
    var id = this.get('session').get('id');
    return this.store.find('user', id);
  }
});


App.ProfileController = Ember.ObjectController.extend({
  actions: {
    updateUserProfile: function() {
      var self = this;

      this.set('error', undefined);
      this.get('model').save()
      .then(function() {
      })
      .catch(function(error) {
        if (error.responseJSON) { error = error.responseJSON; }
        if (error.error) { error = error.error; }
        self.set('error', error);
      });
    }
  }
});

App.GravatarImageComponent = Ember.Component.extend({
  size: 200,
  email: '',

  gravatarUrl: function() {
    var email = this.get('email'),
        size = this.get('size');

    return 'http://www.gravatar.com/avatar/' + md5(email) + '?s=' + size;
  }.property('email', 'size')
});

App.UsersRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('user');
  }
});

App.UserController = Ember.ObjectController.extend({
  // when button for each user is clicked send friend request
  // grey out when the request has been made.
});

App.UsersController = Ember.ArrayController.extend({
  itemController: 'user'
  //filteBy('location')
  //store.find users omit currently signed in person (at some point find users based on location)
  // for each user we want the username, intrests, picture
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
      var credentials = this.getProperties('username', 'password', 'user_email');
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
        var user = self.get('model');
        session.login(user.getProperties('username', 'id'));
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
