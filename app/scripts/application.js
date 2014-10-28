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
    return this.store.createRecord('comment');
 //   return {};
  }
});


App.ProfileController = Ember.ObjectController.extend({
  actions: {
    addComment: function() {
      var session = this.get('session');
      var self = this;

      this.set('error', undefined);
      this.get('model').save() // create the comment
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
  username: DS.attr('string'),
  password: DS.attr('string'),
  user_email: DS.attr('string')
});


App.Comment = DS.Model.extend({
  body: DS.attr('string')
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

//This stuff below is for the navigation controller

// var NavigationController = Ember.ArrayController.extend({
//   content: Ember.A([
//     Ember.Object.create({title: "About", location: 'about', active: null}),
//   ]),
// });

// export default NavigationController;


//Code below is for integrating the gmap API

CityHacker.gmapAPIRoute = Ember.Route.extend({
  
//   // Code from previous project
//   // model: function()
//   // var data =
//   //     near: 'Portland, OR', // TODO: how to change this to work from something on the page?
//   //     section: 'food',
//   //     venuePhotos: '1',

//       // required stuffs
//     //   v: '20141002',
//     //   client_id: 'THF0PIAQPEPL3UJZJGVVXKL5S1FM4P54MGZARXUFJ1ZGBENP',
//     //   client_secret: 'PAY5FKCOQB4NI0CSL5XDXNL1AOA2CA2CWTACTYILINBMK4S0'
//     // }; --}}
    var url = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDk7gb7P3R4gyAbx_p2MeiTwc90BAxDIWM;
    return Ember.$.ajax"({
      type: 'GET',
      url: url,
      data: data,
      dataType: 'JSON'
    })
//     // .then(function(data) {
//      // var url = data.response.groups[0].items[0].venue.photos.groups[0].items[0].prefix;
//      //  console.log(data);
//      //  console.log(data.response);
//      //  console.log(data.response.groups[0]);
//      //  console.log(data.response.groups[0].items);
//       // console.log(data.response.groups[0].items[0]);
//       // console.log(data.response.groups[0].items[0].venue);
//       // console.log(data.response.groups[0].items[0].venue.photos);
//       // console.log(data.response.groups[0].items[0].venue.photos.groups[0]);
//       // console.log(data.response.groups[0].items[0].venue.photos.groups[0].items[0].prefix;

//       // var photoInfo = data.response.groups[0].items[0].venue.photos.groups[0].items[0];
//       // var prefix = photoInfo.prefix;
//       // var suffix = photoInfo.suffix;
//       // var size = "300x300";
//       // var url = prefix + size + suffix;


//       //console log the path, get a url, make sure that url works, set that path equal to url, it will show up in browser
//       // TODO: this should be something from data
//       // var url = 'https://www.google.com/images/srpr/logo11w.png';
//       // return {photoURL: url};
//     });
  })
// // });





// // expose App globally
window.App = App;
