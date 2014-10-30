'use strict';

var config = require('./config');
var knexConfig = require('../knexfile.js')[config.env];
var knex = require('knex')(knexConfig);
var bookshelf = require('bookshelf')(knex);

var User, Token;
User = bookshelf.Model.extend({
  tokens: function() {
    return this.hasMany(Token);
  },
  tableName: 'users'
});
Token = bookshelf.Model.extend({
  user: function() {
    return this.belongsTo(User);
  },
  tableName: 'tokens'
});

module.exports = {
  User: User,
  Token: Token,
  knex: knex,
  bookshelf: bookshelf
};
