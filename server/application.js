'use strict';

var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var compression = require('compression');
var favicon = require('serve-favicon');
var config = require('./config');
var _ = require('lodash');
var models = require('./models'),
  User = models.User,
  Friendship = models.Friendship;


var app = express();
var api = express.Router();
var resources = express();

resources.use(express.static(config.public));

var admit = require('admit-one')('bookshelf', {
  bookshelf: { modelClass: User }
});

if (config.env === 'development') {
  resources.use(express.static(path.join(__dirname, '../app')));
  var connectLivereload = require('connect-livereload');
  app.use(connectLivereload({ port: process.env.LIVERELOAD_PORT || 35729 }));
  app.use(morgan('dev'));
  app.use(resources);
}
if (config.env === 'production') {
  app.use(morgan('default'));
  app.use(favicon(path.join(config.public, 'favicon.ico')));
  app.use(resources);
  app.use(compression());
}
app.use(bodyParser.json());
app.use(methodOverride());

// api routes
var api = express.Router();

api.post('/users', admit.create, function(req, res) {
  // user representations accessible via
  // req.auth.user & req.auth.db.user
  res.json({ user: req.auth.user });
});

api.post('/sessions', admit.authenticate, function(req, res) {
  // user accessible via req.auth
  res.json({ session: req.auth.user });
});
api.get('/users/:id', function(req, res) {
  var params = req.params;
  var id = parseInt(params.id);
  User.where({ id: id }).fetch()
  .then(function(user) {
    res.send({ user: _.omit(user.toJSON(), 'passwordDigest') });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
 });
});

api.put('/users/:id', function(req, res) {
  var params = req.params;
  var id = parseInt(params.id);
  return User.where({ id: id }).fetch()
  .then(function(user) {
    // TODO: what should we do about password, do we want to change passwords?
    // if so, how?
    user.set(_.omit(req.body.user, 'password')); // TODO: discuss security
    return user.save();
  })
  .then(function(user) {
    res.send({ user: _.omit(user.toJSON(), 'passwordDigest') });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
 });
});

//This coincides with the GET request for the server friendship test (/api/users/2/friends) --to be modified accordingly
//will need to return a friendship where it accesses a 2 from requestuser or recipientuser
//and also returns a true. It should log this return in the console.

//Steps: 
// 1. Access the friends json file - use req.params to do this
// 2. return all of the info in that gile

api.get('/users/:id/friends', function(req, res) {
  var params = req.params;  //this checks route params -- /user/:id/friends
  var id = parseInt(params.id); //this is an id integer from the params

  Friendship.fetchAll()
  .then(function(collection) {
    var allFriendships = collection.toJSON();
    function importantThings(friendship) {
      return (friendship.requestUser === id || friendship.recipientUser === id) &&
        friendship.accepted === true;
    }
    var filtered = allFriendships.filter(importantThings);
    console.log(filtered);
    // var userIDs = [filtered[0].recipientUser, filtered[1].recipientUser, filtered[2].requestUser];
    // console.log(userIDs);

    // we need to get all of the users based on filtered.
    // console.log something that has [3,4,5] by looking at filtered.


    var userIDs = filtered.map(function(friendship) {
      if (friendship.requestUser === id) {
        return friendship.recipientUser;
      }
      else if (friendship.recipientUser === id) {
        return friendship.requestUser;
      }
    });
    console.log(userIDs);



    // next step:
    // Users.fetchAll()
    // .then(function(collection) {

    // };



  })
  .then(function() {
    // come back to this later...
    var users = [];
    res.json({users: users});
  });
  // .then(function(collection) {
  //   res.send({friends.filtered});
  // });


// console.log(importantThings(things));


  // return friends.where({ id: id }).fetchall()
  // .then(function(friends) {
  //   // TODO: what should we do about password, do we want to change passwords?
  //   // if so, how?
  //   friends.set(_.omit(req.body.friends, 'password')); // TODO: discuss security
  //   return friends.save();


//   .then(function(friends) {
//     // TODO: what should we do about password, do we want to change passwords?
//     // if so, how?
//     friends.set(_.omit(req.body.friends, 'password')); // TODO: discuss security
//     return friends.save();
//   })
//   .then(function(user) {
//     res.send({ user: _.omit(user.toJSON()) });
//   })
//   .catch(function(e) {
//     res.status(500);
//     res.send({ error: e });
//  });

  // this is temporary to make the test not timeout
  // res.send({});
});


api.use(admit.authorize);

api.delete('/sessions/current', admit.invalidate, function(req, res) {
  if (req.auth.user) { throw new Error('Session not invalidated.'); }
  res.json({ status: 'ok' });
});

api.get('/example', function(req, res) {
  res.json({});
});

// single-page app routes
app.use('/api', api);
app.get('/*', function(req, res, next) {
  req.url = '/index.html';
  next();
}, resources);

// expose app
module.exports = app;

// start server
if (require.main === module) {
  app.listen(config.port, function() {
    return console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
  });
}
