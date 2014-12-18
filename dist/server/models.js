'use strict';

var config = require('./config');
var knexConfig = require('./knexfile.js')[config.env];
var knex = require('knex')(knexConfig);
var bookshelf = require('bookshelf')(knex);


var User, Token, Friendship;

/**
 * The user model.
 *
 * @constructor User
 * @extends {bookshelf.Model}
 */
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

Friendship = bookshelf.Model.extend({
  tableName: 'friendship'
});

module.exports = {
  User: User,
  Token: Token,
  Friendship: Friendship,
  knex: knex,
  bookshelf: bookshelf
};
