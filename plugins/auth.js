'use strict'
const fp = require('fastify-plugin')
const fastifyJwt = require('@fastify/jwt')

module.exports = fp(async function authenticationPlugin (fastify, opts) {
  const revokedTokens = new Map()

  fastify.register(fastifyJwt, {
    secret: fastify.secrets.JWT_SECRET,
    trusted: function isTrusted (request, decodedToken) {
      return !revokedTokens.has(decodedToken.jti)
    }

  })

  fastify.decorate('authenticate', async function authenticate (request, reply) {
    try {
      await request.jwtVerify()
    } catch (error) {
      reply.send(error)
    }
  })

  // the hook add methods to the request opject
  fastify.decorateRequest('revokeToken', function () {
    revokedTokens.set(this.user.jti, true)
  })

  fastify.decorateRequest('generateToken', async function () {
    const token = await fastify.jwt.sign({
      id: String(this.user.id),
      username: this.user.username
    }, {
      jti: String(Date.now()),
      expiresIn: fastify.secrets.JWT_EXPIRE_IN
    })

    return token
  })
}, {
  name: 'authentication-plugin',
  dependencies: ['application-config']
})
