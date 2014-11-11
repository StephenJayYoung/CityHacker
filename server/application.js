'use strict';

var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var compression = require('compression');
var uuid = require('node-uuid');
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

// Removes password and email from User Info
var sanitizeUser = function(user) {
  return _.omit(user, 'passwordDigest', 'user_email');
};

api.post('/users', admit.create, function(req, res) {
  var requestUser = req.body.user;
  var responseUser = req.auth.user;
  var dbUser = req.auth.db.user;
  responseUser.user_email = requestUser.user_email;
  dbUser.set('user_email', requestUser.user_email);
  dbUser.save().then(function() {
    res.json({ user: responseUser });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
  });
});

api.post('/sessions', admit.authenticate, function(req, res) {
  // user accessible via req.auth
  res.json({ session: req.auth.user });
});

// Gets by User Id, removes password and email

api.get('/users/:id', function(req, res) {
  var params = req.params;
  var id = parseInt(params.id);
  User.where({ id: id }).fetch()
  .then(function(user) {
    res.send({ user: sanitizeUser(user.toJSON()) });
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
    user.set(_.omit(req.body.user, 'password'));
    return user.save();
  })
  .then(function(user) {
    res.send({ user: sanitizeUser(user.toJSON()) });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
 });
});

api.get('/users', function(req, res) {
  var query = req.query;
  var lat = parseFloat(query.lat);
  var lng = parseFloat(query.lng);
  var radius = parseFloat(query.radius);

  var collection = User;
  if (lat && lng && radius) {
    var findRange = function(qb) {
      qb.whereRaw('("location_latitude" >= ?) and ("location_latitude" <= ?) and ("location_longitude" >= ?) and ("location_longitude" <= ?)',
       [lat-radius, lat+radius, lng-radius, lng+radius]);
    };
    collection = User.query(findRange);
  }

  return collection.fetchAll()
  .then(function(users) {
    var usersWithoutPasswords = users.toJSON()
    .map(sanitizeUser);
    res.send({ users: usersWithoutPasswords });
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

  var query = req.query;
  var asked = query.asked;
  var where;

  if (asked === 'them') {
    where = function(qb) {
      qb.whereRaw('("recipientUser" = ?) and ("accepted" = ?)',
        [id, false]);
    };
  }
  else if (asked === 'me') {
    // do stuff that's not yet written
    throw new Error('Not yet handled');
  }
  else {
    where = function(qb) {
      qb.whereRaw('("requestUser" = ? or "recipientUser" = ?) and ("accepted" = ?)',
        [id, id, true]);
    };
  }

  Friendship.query(where).fetchAll()
  .then(function(collection) {
    var userIDs = collection.toJSON().map(function(friendship) {
      return friendship.requestUser === id ?
        friendship.recipientUser :
        friendship.requestUser;
    });
    var whereIDInUserIDs = function(qb) { qb.whereIn('id', userIDs); };
    return User.query(whereIDInUserIDs).fetchAll();
  })
  .then(function(users) {
    res.json({users: users.toJSON() });
  });
});

api.post('/users/:id/friendships', function(req, res) {
  var params = req.params;
  var acceptID = uuid.v4().replace(/-/g, ''); // regex that looks for `-` globally
  var userID = parseInt(params.id);
  var friendID = req.body.user_id;
  var data = {
    acceptID: acceptID,
    requestUser: userID,
    recipientUser: friendID,
    accepted: false
  };

  Friendship.forge(data).save(data)
  .then(function(friendship) {
    res.send({ friendship: friendship });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
  });
});

api.put('/users/:id/friendships', function(req, res) {
  var userID = parseInt(req.params.id);
  console.log();
  return Friendship.where({ recipientUser: userID }).fetch()
  .then(function(friendship){
    friendship.set('accepted', true);
    return friendship.save();
  })
  .then(function(friendship){
    res.send({ friendship: friendship });
  })
  .catch(function(e) {
    res.status(500);
    res.send({ error: e });
  });
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
