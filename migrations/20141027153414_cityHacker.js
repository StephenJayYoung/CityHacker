'use strict';

// The user.js migration is our original migration, which...
// Creates a User
// Creates a Login Token each time a person logs in
// The cityHacker.js migration modifies the User

exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    // Current migration makes User
    // Users will have Visible Name (created here)
    // User will have Interests, Loc lat/long, Email, Pic, Friends,
    table.string('user_email').notNullable();
    table.string('visibleName')
    table.string('interests')
    table.string('location_latitude');
    table.string('location_longitude');
    table.string('picture');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('lkjlkj'); // TODO: whit totally guessed here
    table.dropColumn('visibleName');
    table.dropColumn('interests');
    table.dropColumn('location_latitude');
    table.dropColumn('location_longitude');
    table.dropColumn('user_email');
    table.dropColumn('picture');
  });
};
