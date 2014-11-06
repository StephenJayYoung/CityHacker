'use strict';

// The user.js migration creates a User
// The cityHacker.js migration modifies the User
// The location.js migration modifies the user locations to integers.

exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('location_latitude');
    table.dropColumn('location_longitude');
  })
  .table('users', function(table) {
    table.integer('location_latitude');
    table.integer('location_longitude');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('location_latitude');
    table.dropColumn('location_longitude');
  })
  .table('users', function(table) {
    table.string('location_latitude');
    table.string('location_longitude');
  });
};
