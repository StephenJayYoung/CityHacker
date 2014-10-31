'use strict';

process.env.NODE_ENV = 'test';

require('chai').use(require('sinon-chai'));
require('bluebird').longStackTraces();

var _ = require('lodash');
var path = require('path');
var BPromise = require('bluebird');
var util = require('util');
var request = BPromise.promisifyAll(require('request'));
var expect = require('chai').expect;

GLOBAL.__app = function(app, fn) {
  return function() {

    var server;
    var port = 38239;
    var baseURL = util.format('http://localhost:%d', port);
    var helpers = {};

    before(function(done) {
      server = app.listen(port, done);
    });

    after(function(done) {
      server.close(done);
    });

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
    helpers.setupDatabase = function(modelClass, fixtureName, fixtureKey) {
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
    helpers.testAPI = function(fixtureName) {
      var fixture = __fixture(path.join('http', fixtureName));
      var method = fixture.request.method;
      var methodName = method + 'Async';
      var url = baseURL + fixture.request.url;
      var jsonData = fixture.request.json;
      return request[methodName]({ url: url, json: jsonData })
      .then(function(args) {
        var body = args[1];
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
    helpers.testDatabaseContents = function(modelClass, fixtureName, fixtureKey) {
      var fixture = __fixture(path.join('http', fixtureName));
      return modelClass.fetchAll()
      .then(function(objects) {
        expect(_.sortBy(objects.toJSON(), 'id'))
          .to.eql(_.sortBy(fixture[fixtureKey], 'id'));
      });
    };

    fn(helpers);
  };
};

GLOBAL.__fixture = function(name) {
  var _ = require('lodash');
  var path = require('path');
  return _.cloneDeep(require(path.join(__dirname, 'fixtures', name)));
};
