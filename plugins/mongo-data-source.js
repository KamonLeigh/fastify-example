const fp = require('fastify-plugin')
const fastifyMongo = require('@fastify/mongodb')

module.exports = fp(async function (fastify, opts) {
  fastify.register(fastifyMongo, {
    forceClose: true,
    url: fastify.secrets.MONGO_URL
  })
}, {
  dependencies: ['application-config']
})
