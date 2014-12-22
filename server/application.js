'use strict';

var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var BPromise = require('bluebird');
var compression = require('compression');
var uuid = require('node-uuid');
var favicon = require('serve-favicon');
var md5 = require('MD5');
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
var prepareUser = function(user) {
  var email = user.user_email;
  user = _.omit(user, 'passwordDigest', 'user_email');
  user = _.extend(user, {
    picture: 'http://www.gravatar.com/avatar/' + md5(email || '')
  });
  return user;
};

var prepareUserWithEmail = function(user) {
  var email = user.user_email;
  user = _.omit(user, 'passwordDigest');
  user = _.extend(user, {
    picture: 'http://www.gravatar.com/avatar/' + md5(email || '')
  });
  return user;
};

api.post('/users', admit.create, function(req, res) {
  var requestUser = req.body.user;
  var responseUser = req.auth.user;
  var dbUser = req.auth.db.user;
  responseUser.user_email = requestUser.user_email;
  responseUser.picture = 'http://www.gravatar.com/avatar/' + md5(requestUser.user_email || '');
  dbUser.save()
  .then(function() {
    dbUser.set('user_email', requestUser.user_email);
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

//helper for creating error status code
var standardCatch = function(req, res) {
  return function(e) {
    res.status(e.statusCode || 500);
    res.send({ error: e.message });
  };
};
// helper for creating error messages
var throwWithStatus = function(status, message) {
  var e = new Error(message);
  e.statusCode = status;
  throw e;
};

api.put('/users/:id', function(req, res) {
  var params = req.params;
  var id = parseInt(params.id);
  return User.where({ id: id }).fetch()
  .then(function(user) {
    if (!user) { throwWithStatus(404, 'Not found'); }
    user.set(_.pick(req.body.user, 'username', 'interests', 'location_longitude', 'location_longitude', 'user_email', 'visibleName', 'bio'));
    return user.save();
  })
  .then(function(user) {
    res.send({ user: prepareUser(user.toJSON()) });
  })
  .catch(standardCatch(req, res));
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
    .map(prepareUser);
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
// 2. return all of the info in that file

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
    where = function(qb) {
      qb.whereRaw('("requestUser" = ?) and ("accepted" = ?)',
        [id, false]);
    };
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
    res.json({users: users.toJSON().map(prepareUser) });
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

api.get('/users/:id', admit.extract, function(req, res) {
  var requestedUserID = parseInt(req.params.id);
  var loggedInUserID = req.auth.user ? req.auth.user.id : undefined;
  var usersAreFriends = false;

  /**
   * Configures the query builder to get us all of the friendships that exist
   * for a user in the database.
   *
   * This configures the query builder to search for a friendship pertaining to
   * both users in the database. A friendship exists if it satisfies the
   * following:
   *
   *   1. `requestedUser` and `loggedInUser` are defined on the freiendship
   *   1. The friendship has been accepted.
   *
   * @param {knex.QueryBuilder} qb - The query builder to configure.
   */
  var configureFriendshipQuery = function(qb) {
    qb.whereRaw('(("requestUser" = ? and "recipientUser" = ?) or ' +
      '("requestUser" = ? and "recipientUser" = ?)) and accepted = ?',
    [loggedInUserID,requestedUserID, requestedUserID, loggedInUserID, true]);
  };

  var configureSignIn = function(qb) {};
  


  var evalUserIsLoggedin = function() {
    console.log();
  };
  /**
   * Fetches all of the friendships that apply for the logged in user & the
   * requested user (as defined in `configureFriendshipQuery`). It accesses
   * these friendships in the database and pulls them out, making them
   * available for use in the next function.
   *
   * @return {Promise} A promise that resolves with the fetched friendships.
   */
  var fetchFriendships = function() {
    return Friendship.query(configureFriendshipQuery).fetchAll();
  };

  /**
   * Evaluate if the logged in user & the requested user are friends.
   *
   * It assumes that `friendships` is the resolved value from
   * `fetchFriendships`.
   *
   * This uses `friendships` (which is pulled from the database). It assumes
   * that `friendships` is a value that was fetched using the requirements from
   * `configureFriendshipQuery`. Since that defines the requirements for
   * frienship, this function determines that the logged in user and requested
   * user are friends if there are one or more items in the collection.
   *
   * This will set the variable `usersAreFriends` after determing if the users
   * are friends.
   *
   * @param {FreindshipCollection} friendships - The friendships to use to
   * evaluate if users are friends.
   */
  var evalIfUsersAreFriends = function(friendships) {
    usersAreFriends = (friendships.length >= 1);
  };

  /**
   * This fetches the requested users based on `requestedUserID`.
   *
   * @return {Promise}  A promise that resolves with the fetched user.
   */
  var fetchRequestedUser = function() {
    return User.where({ id: requestedUserID }).fetch();
  };

  
  /**
   * This returns the user info. It *will* return the user email if they are
   * friends. It will *not* return the user email if they are not friends.
   *
   * If it is determined that the users are friends, this method will respond
   * with the requested user's information. If it is determined that the users
   * are not friends, this method will return the user's info, but will omit
   * the `user_email`.
   *
   * It will always omit the `passwordDigest`.
   *
   * @param {User} user - The user to respond with.
   */
  var sendResponse = function(user) {
    var response = user.toJSON();
    if (usersAreFriends) {
      response = prepareUserWithEmail(response);
    }
    else {
      response = prepareUser(response);
    }
    res.send({ user: response });
  };


  var promise = BPromise.resolve();
  if (loggedInUserID) { // this is the same as if logged in
    promise = promise
      .then(fetchFriendships)
      .then(evalIfUsersAreFriends)
      .then(evalUserIsLoggedin);
  }
  promise
    .then(fetchRequestedUser)
    .then(sendResponse);
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
