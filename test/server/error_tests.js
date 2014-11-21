'use strict';

var sinon = require('sinon');
var uuid = require('node-uuid');
var app = require('../../server/application');

var models = require('../../server/models'),
  User = models.User,
  // Friendship = models.Friendship,
  // Token = models.Token,
  knex = models.knex;

describe('API for errors', __app(app, function(H) {
//creates a random id and replaces them all with fake id for friendship
  beforeEach(function() {
    sinon.stub(uuid, 'v4').returns('random-9384');
  });

  afterEach(function() {
    uuid.v4.restore();
  });

  beforeEach(function(done) {
    knex('friendship').delete().then(function() {
      return knex('tokens').delete();
    })
    .then(function() {
      return knex('users').delete();
    })
    .then(function() {
      return knex.raw('alter sequence friendship_id_seq restart');
    })
    .then(function() {
      return knex.raw('alter sequence users_id_seq restart');
    })
    .then(function() { done(); }, done);
  });

  it('handles PUT /api/users/1 where there is an error',
   function(done) {
    H.setupDatabase(User, 'users/put-error', 'database-users')
    .then(function() { return H.testAPI('users/put-error'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/put-error',
        'database-users-result');
    })
    .done(done, done);
    // adds or changes visible name, interests, location, email, and pictures
  });
  it('handles GET /api/users/1 where there is an error',
   function(done) {
    H.setupDatabase(User, 'users/get-error', 'database-users')
    .then(function() { return H.testAPI('users/get-error'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/get-error',
        'database-users-result');
    })
    .done(done, done);
    // adds or changes visible name, interests, location, email, and pictures
  });
}));