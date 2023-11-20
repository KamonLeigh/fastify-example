'use strict'

// This file contains code that we reuse
// between our tests.

const { build: buildApplication } = require('fastify-cli/helper')
const path = require('path')
const crypto = require('node:crypto')
const AppPath = path.join(__dirname, '..', 'app.js')
const fcli = require('fastify-cli/helper')

const startArgs = '-l info --options app.js'

// Fill in this config with all the configurations
// needed for testing the application
function config (env) {
  return {
    configData: env
  }
}

// automatically build and tear down our instance
async function build (t) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await buildApplication(argv, config())

  // tear down our app after we are done
  t.teardown(app.close.bind(app))

  return app
}

const defaultEnv = {
  NODE_ENV: 'test',
  MONGO_URL: 'mongodb://0.0.0.0:27017/test',
  JWT_SECRET: 'secret-1234567890'
}

async function buildApp (t, env, serverOptions) {
  const app = await fcli.build(startArgs,
    config({ ...defaultEnv, ...env }),
    serverOptions
  )
  // t.teardown(() => { app.close() })
  t.teardown(app.close.bind(app))

  return app
}

async function buildUser (app) {
  const randomUser = crypto.randomBytes(16).toString('hex')
  const password = 'icanpass'

  await app.inject({
    method: 'POST',
    url: '/register',
    payload: {
      username: randomUser,
      password
    }
  })

  const login = await app.inject({
    method: 'POST',
    url: '/authenticate',
    payload: {
      username: randomUser,
      password
    }
  })

  return {
    username: randomUser,
    password,
    token: login.json().token
  }
}

module.exports = {
  config,
  build,
  buildApp,
  buildUser
}
