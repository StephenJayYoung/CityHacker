'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

var expect = require('chai').expect;
var app = require('../../server/application');

var models = require('../../server/models'),
  User = models.User,
  knex = models.knex;

describe('API for Users', __app(app, function(H) {

  beforeEach(function(done) {
    knex('users').delete().then(function() {
      return knex.raw('alter sequence users_id_seq restart');
    }).then(function() { done(); }, done);
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

  it.skip('handles GET /api/users/1', function(done) {
    H.setupDatabase(User, 'users/get', 'database-users')
    .then(function() { return H.testAPI('users/get'); })
    .then(function() {
      return H.testDatabaseContents(User, 'users/get',
        'database-users-result');
    })
    .done(done, done);
  });
}));