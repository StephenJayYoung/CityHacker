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

  it('handles PUT /api/users/1', function(done) {
    var data = {
      passwordDigest: 'not-real-digest',
      username: 'Milo',
    };

    var putData = {
      interests: null,
      location_latitude: null,
      location_longitude: null,
      picture: null,
      user_email: null,
      username: 'Sir Flops Alot',
      visibleName: 'Awesome Milo'
    };

    User.forge(data).save().then(function() {
      return request.putAsync({
        url: baseURL + '/api/users/1',
        json: putData
      });
    }).spread(function(response, body) {
      // console.log(response);
      // console.log(body);
      expect(body).to.eql({
          id: 1,
          interests: null,
          location_latitude: null,
          location_longitude: null,
          picture: null,
          user_email: null,
          username: 'Sir Flops Alot',
          visibleName: 'Awesome Milo'
      });
      return User.fetchAll();
    })
    .then(function(users){
      expect(users.toJSON()).to.eql([{
          id: 1,
          interests: null,
          location_latitude: null,
          location_longitude: null,
          passwordDigest: 'not-real-digest',
          picture: null,
          user_email: null,
          username: 'Sir Flops Alot',
          visibleName: 'Awesome Milo'
        }]);
    })
    .done(done, done);
// creates new user
// adds or changes visible name, interests, location, email, and pictures
  });
});
