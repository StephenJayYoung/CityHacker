'use strict';

// The user.js migration is our original migration, which...
// Creates a User
// Creates a Login Token each time a person logs in
// The cityHacker.js migration modifies the User

exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('user_email');
  }).table('users', function(table) {
    table.string('user_email');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('user_email');
  }).table('users', function(table) {
    table.string('user_email').notNullable();
  });
};
