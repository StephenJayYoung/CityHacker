'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

var expect = require('chai').expect;
var sinon = require('sinon');
var uuid = require('node-uuid');
var app = require('../../server/application');

var models = require('../../server/models'),
  User = models.User,
  Friendship = models.Friendship,
  knex = models.knex;

describe('API for Users', __app(app, function(H) {
//creates a random id and replaces them all with fake id
  beforeEach(function() {
    sinon.stub(uuid, 'v4').returns('random-9384');
  });

  afterEach(function() {
    uuid.v4.restore();
  });

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

  it('handles POST /api/users/2/friendships', function(done) {
    H.setupDatabase(User, 'users/2/post_friendships', 'database-users')
    .then(function() { return H.testAPI('users/2/post_friendships'); })
    .then(function() {
      return H.testDatabaseContents(Friendship, 'users/2/post_friendships', 'database-friendships');
    })
    .done(done, done);
  });

  it.skip('handles PUT /api/users/2/friendships', function(done) {
    H.setupDatabase(User, 'users/2/accept_friendships', 'database-users')
    .then(function() {
      return H.setupDatabase(Friendship, 'users/2/accept_friendships',
        'database-friendships');
    })
    .then(function() { return H.testAPI('users/2/accept_friendships'); })
    .then(function() {
      return H.testDatabaseContents(Friendship, 'users/2/accept_friendships', 'database-users-result');
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


  // these are the requests that user 2 (Steve) has made, but the other user
  // has not yet responded to.
  it('handles GET /api/users/2/friends?asked=me');

  // these are the requests that user 2 (Steve) has received, but not responded
  // to.
  it('handles GET /api/users/2/friends?asked=them', function(done) {
    var fixture = 'users/2/friend_requests';
    H.setupDatabase(User, fixture, 'database-users')
    .then(function() {
      return H.setupDatabase(Friendship, fixture,
        'database-friendships');
    })
    .then(function(){
      return H.testAPI(fixture, { order: 'users.id' });
    })
    .done(done, done);
  });

}));
