'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function userAutoHooks (fastify, opts) {
  const users = fastify.mongo.db.collection('users')

  fastify.decorate('usersDataSource', {
    async readUser (username) {
      const user = await users.findOne({ username })
      return user
    },
    async create (user) {
      const newUser = await users.insertOne(user)
      return newUser.insertedId
    }
  })
}, {
  encapsulate: true,
  dependencies: ['@fastify/mongodb']
})
