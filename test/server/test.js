'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

// var _ = require('lodash');
var expect = require('chai').expect;
// var request = require('request');
// var util = require('util');
// var knex = server.knex;
var app = require('../../server/application');

describe('server', function() {
  it('has one passing test', function() {
    expect(app).to.exist;
  });
//   it('handles PUT /api/users:visibleName', function(){
//     expect(response.body)to.eql()
//     expect
//   });
});
