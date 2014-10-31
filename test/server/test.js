'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

// var _ = require('lodash');
var expect = require('chai').expect;
var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var util = require('util');
var app = require('../../server/application');
var server;
var port = 38239;

var models = require('../../server/models'),
  User = models.User,
  knex = models.knex;

var baseURL = util.format('http://localhost:%d', port);


var _ = require('lodash');
var path = require('path');

/**
 * Set up the database for a specific model with fixture data.
 *
 * @param  {Class} modelClass - The bookshelf model class that you want to
 * setup.
 * @param {String} fixtureName - The fixture (without `fixture/http` in it).
 * @param {String} fixtureKey - The key to use from the fixture to setup data.
 * When looking up that value in the fixture, it's assumed to be an array.
 * @return {Promise} The promise for when the database is set up.
 */
var setupDatabase = function(modelClass, fixtureName, fixtureKey) {
  var fixture = __fixture(path.join('http', fixtureName));
  var array = fixture[fixtureKey];
  return BPromise.map(array, function(data) {
    return modelClass.forge(data).save({}, { method: 'insert' });
  });
};

/**
 * Test an API using fixture data.
 *
 * @param {String} fixtureName - The fixture (without `fixture/http` in it).
 * @return {Promise} The promise for when the API has been tested.
 */
var testAPI = function(fixtureName) {
  var fixture = __fixture(path.join('http', fixtureName));
  var method = fixture.request.method;
  var methodName = method + 'Async';
  var url = baseURL + fixture.request.url;
  var jsonData = fixture.request.json;
  return request[methodName]({ url: url, json: jsonData })
  .then(function(args) {
    var response = args[0], body = args[1];
    expect(body).to.eql(fixture.response.json);
  });
};

/**
 * Test database contents using fixture data.
 *
 * @param  {Class} modelClass - The bookshelf model class that you want to
 * setup.
 * @param {String} fixtureName - The fixture (without `fixture/http` in it).
 * @param {String} fixtureKey - The key to use from the fixture to setup data.
 * When looking up that value in the fixture, it's assumed to be an array.
 * @return {Promise} The promise for when the database has been tested.
 */
var testDatabaseContents = function(modelClass, fixtureName, fixtureKey) {
  var fixture = __fixture(path.join('http', fixtureName));
  return modelClass.fetchAll()
  .then(function(objects) {
    expect(_.sortBy(objects.toJSON(), 'id'))
      .to.eql(_.sortBy(fixture[fixtureKey], 'id'));
  })
};

describe('app', function() {
  before(function(done) {
    server = app.listen(port, done);
  });

  after(function(done) {
    server.close(done);
  });

  beforeEach(function(done) {
    knex('users').delete().then(function() {
      return knex.raw('alter sequence users_id_seq restart');
    }).then(function() { done(); }, done);
  });

  it('has one passing test', function() {
    expect(app).to.exist;
  });

  it('handles PUT /api/users/1', function(done) {
    setupDatabase(User, 'users/put', 'database-users')
    .then(function() { return testAPI('users/put'); })
    .then(function() {
      return testDatabaseContents(User, 'users/put', 'database-users-result');
    })
    .done(done, done);
    // adds or changes visible name, interests, location, email, and pictures
  });

  it.skip('handles GET /api/users/1', function(done) {
    setupDatabase(User, 'users/get', 'database-users')
    .then(function() { return testAPI('users/get'); })
    .then(function() {
      return testDatabaseContents(User, 'users/get', 'database-users-result');
    })
    .done(done, done);
  });
});
