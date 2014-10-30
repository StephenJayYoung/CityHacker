'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

// var _ = require('lodash');
var expect = require('chai').expect;
var bluebird = require('bluebird');
var request = bluebird.promisifyAll(require('request'));
var util = require('util');
var app = require('../../server/application');
var server;
var port = 38239;

var models = require('../../server/models'),
  User = models.User,
  knex = models.knex;

var baseURL = util.format('http://localhost:%d', port);

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

  it.skip('handles PUT /api/users/1', function(done) {
    var data = {
      username: 'Milo',
      passwordDigest: 'not-real-digest',
      visibleName: 'Awesome Milo'
    };
    User.forge(data).save().then(function() {
      return request.putAsync(baseURL + '/api/users');
    }).spread(function(response, body) {
      console.log(response);
      console.log(body);
      expect(JSON.parse(body)).to.eql({
        users: [{
          id: 1,
          username: 'Milo',
          password: 'bark',
          visibleName: 'Awesome Milo'
        }]
      });
    })
    .then(done, done);
// creates new user
// adds or changes visible name, interests, location, email, and pictures
  });
});
