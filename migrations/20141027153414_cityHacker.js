'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('username').notNullable();
    table.string('passwordDigest').notNullable();
  }).createTable('tokens', function(table) {
    table.increments('id').primary();
    table.integer('user_id').references('users.id');
    table.string('value').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tokens').dropTable('users');
};
