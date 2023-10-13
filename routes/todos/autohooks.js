"use strict"

const fp = require('fastify-plugin');
const schemas = require('./schemas/loader')
module.exports = async function todoAutoHooks(fastify, _opts) {
    fastify.register(schemas);
    console.log('running')
    const todos = fastify.mongo.db.collection('todos')

    //fastify.register(todos)
    fastify.decorate('todos', todos);
}