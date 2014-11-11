'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

var expect = require('chai').expect;
var app = require('../../server/application');

var models = require('../../server/models'),
  User = models.User,
  Friendship = models.Friendship,
  knex = models.knex;

describe('API for Users', __app(app, function(H) {

  beforeEach(function(done) {
    knex('friendship').delete().then(function() {
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

  it('has one passing test', function() {
    expect(app).to.exist;
  });

  it('handles PUT /api/users/1', function(done) {
    H.setupDatabase(User, 'users/put', 'database-users')
    .then(function() { return H.testAPI('users/put'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/put',
        'database-users-result');
    })
    .done(done, done);
    // adds or changes visible name, interests, location, email, and pictures
  });

  it('handles GET /api/users/2/friends', function(done) {
    var api = 'users/2/friends';
    H.setupDatabase(User, api, 'database-users')
    .then(function() {
      return H.setupDatabase(Friendship, api,
        'database-friendships');
    })
    .then(function() {
      return H.testAPI(api, { order: 'users.id' });
    })
    .done(done, done);
  });

  it.skip('handles POST /api/users/2/post_friendship', function(done) {
    H.setupDatabase(User, 'users/2/post_friendship', 'database-users')
    .then(function() { return H.testAPI('users/2/post_friendship'); })
    .then(function() {
      return H.testDatabaseContents(Friendship, 'users/2/post_friendship', 'database-friendships');
    })
    .done(done, done);
  });


  it('handles GET /api/users with location', function(done) {
    H.setupDatabase(User, 'users/get-by-location', 'database-users')
    .then(function(){
      return H.testAPI('users/get-by-location', { order: 'users.id' });
    })
    .then(function(){
      return H.testDatabaseContents(User,
        'users/get-by-location',
        'database-users');
    })
    .done(done, done);
  });

  it('handles GET /api/users/1', function(done) {
    H.setupDatabase(User, 'users/get', 'database-users')
    .then(function() { return H.testAPI('users/get'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/get',
        'database-users');
    })
    .done(done, done);
  });

// Tests that we can retrieve User Info with password and email omitted

  it('handles GET /api/users', function(done) {
    H.setupDatabase(User, 'users/users', 'database-users')
    .then(function() { return H.testAPI('users/users', { order: 'users.id' }); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/users',
        'database-users');
    })
    .done(done, done);
  });

  it('handles GET /api/users/2/friends', function(done) {
    var api = 'users/2/friends';
    H.setupDatabase(User, api, 'database-users')
    .then(function() {
      return H.setupDatabase(Friendship, api,
        'database-friendships');
    })
    .then(function() {
      return H.testAPI(api, { order: 'users.id' });

    })
    .done(done, done);
  });

  // TODO: once the test is passing, come back & discuss the URL for this
  it.skip('handles GET /api/2/friend_requests', function(done) {
    // there is one problem in this function. if you compare to the test
    // in line 43, you should have an idea of what's different between the
    // two & be able to come up with an idea of how these things differ.
    var api = 'users/2/friend_requests';
    H.setupDatabase(User, api, 'database-users')
    .then(function(){
      return H.testAPI(api, { order: 'users.id' });
    })
    .done(done, done);
  });

}));
