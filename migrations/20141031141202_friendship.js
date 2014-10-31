'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('friendship', function(table) {
    table.increments('id').primary();
    table.integer('requestUser').references('users.id');
    table.integer('recipientUser').references('users.id');
    table.string('acceptID');
    table.boolean('accepted');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('friendship');
};
