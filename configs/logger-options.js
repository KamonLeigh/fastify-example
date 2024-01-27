// When we configue the logger away from default we lose response time

// We add this back in by exporting this config

module.exports = {

  transport:

      {
        target: 'pino-mongodb',
        options: {
          uri: process.env.MONGP_URL_LOG,
          collections: 'log-collection'
        },
        level: process.env.LOG_LEVEL || 'warn',
        timestamp: () => {
          const dateString = new Date(Date.now()).toISOString()
          return `,"@timestamp":"${dateString}"`
        }
      },

  redact: {
    censor: '***',
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.email'
    ]
  },
  serializers: {
    res: function (reply) {
      return {
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime()
      }
    },
    req: function (request) {
      // set config { logBody: true } in any particular route
      const shouldLogBody = request.context.config.logBody === true
      return {
        method: request.method,
        version: request.headers?.['accept-version'],
        user: request.user?.id,
        request: request.headers,
        body: shouldLogBody ? request.body : undefined
      }
    }
  }
}
