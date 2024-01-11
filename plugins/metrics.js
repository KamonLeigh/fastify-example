'use strict'

const fp = require('fastify-plugin')
const Fastify = require('fastify')

module.exports = fp(async function (app) {
  if (process.env.NODE_ENV === 'production') {
    app.register(require('fastify-metrics'), {
      defaultMetrics: { enabled: true },
      endpoint: null,
      name: 'metrics',
      routeMetrics: { enabled: true }
    })

    const promServer = Fastify({ logger: app.log })

    promServer.route({
      url: '/metrics',
      method: 'GET',
      logLevel: 'info',
      handler: (_, reply) => {
        reply.type('text/plain')
        return app.metrics.client.register.metrics()
      }
    })

    await promServer.listen({ port: 9001, host: '0.0.0.0' })
    app.addHook('onClose', async (instance) => {
      console.log('running')
      await promServer.close()
    })
  }
}, {
  name: 'prom'
})
