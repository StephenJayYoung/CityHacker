'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var uuid = require('node-uuid');
var app = require('../../server/application');

var models = require('../../server/models'),
  User = models.User,
  Friendship = models.Friendship,
  Token = models.Token,
  knex = models.knex;

describe('API for errors', __app(app, function(H) {
//creates a random id and replaces them all with fake id
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
    H.setupDatabase(User, 'users/error', 'database-users')
    .then(function() { return H.testAPI('users/error'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/error',
        'database-users-result');
    })
    .done(done, done);
    // adds or changes visible name, interests, location, email, and pictures
  });
}));