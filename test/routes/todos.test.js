'use strict'

const t = require('tap')
const { buildApp, buildUser } = require('../helper')

t.beforeEach(async (t) => {
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://0.0.0.0:27017/test-' + Date.now()
  })

  const user = await buildUser(app)

  t.context = { user, app }
})

t.test('access denied', async (t) => {
  const result = await t.context.app.inject({
    url: '/todos'
  })
  t.equal(result.statusCode, 401)
})

t.test('access allowed', async (t) => {
  const { token } = t.context.user
  const list = await t.context.app.inject({
    url: '/todos',
    ...headers(token)
  })
  t.equal(list.statusCode, 200)
  t.same(list.json(), {
    data: [],
    totalCount: 0
  })
})

t.test('User isolation', async (t) => {
  const { app } = t.context
  const userOne = await t.context.user
  const userTwo = await buildUser(app)

  await app.inject({
    url: '/todos',
    method: 'POST',
    payload: { title: 'user one' },
    ...headers(userOne.token)
  })

  await app.inject({
    url: '/todos',
    method: 'POST',
    payload: { title: 'user two' },
    ...headers(userTwo.token)
  })
  {
    const list = await app.inject({ url: '/todos', ...headers(userOne.token) })
    t.equal(list.statusCode, 200)
    t.match(list.json(), {
      data: [{ title: 'user one' }],
      totalCount: 1
    })
  }

  {
    const list = await app.inject({ url: '/todos', ...headers(userTwo.token) })
    t.equal(list.statusCode, 200)
    t.match(list.json(), {
      data: [{ title: 'user two' }],
      totalCount: 1
    })
  }
})

function headers (token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
}
