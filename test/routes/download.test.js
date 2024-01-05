'use strict'
const fs = require('node:fs')
const path = require('node:path')

const t = require('tap')
const form = require('form-auto-content')

const { buildApp, buildUser } = require('../helper')

t.beforeEach(async (t) => {
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://0.0.0.0:27017/test-' + Date.now()
  })

  const user = await buildUser(app)

  t.context = { app, user }
})

t.test('access denied', async (t) => {
  const result = await t.context.app.inject({
    url: '/todos'
  })

  t.equal(result.statusCode, 401)
})

t.test('download', async (t) => {
  const { app, user: { token } } = t.context
  const myForm = form({
    todoListFile: getImportFileStream('import-todo-list.csv')
  })

  const importFile = await app.inject({
    method: 'POST',
    url: '/todos/files/import',
    payload: myForm.payload,
    ...headers(token, myForm.headers)
  })

  t.equal(importFile.statusCode, 201)

  const create = await app.inject({
    method: 'POST',
    url: '/todos',
    payload: { title: 'manual' },
    ...headers(token)
  })

  t.equal(create.statusCode, 201)

  const download = await app.inject({
    method: 'GET',
    url: '/todos/files/export',
    ...headers(token)
  })

  t.equal(download.statusCode, 200)
  t.equal(download.headers['content-type'], 'text/csv')

  const lines = download.payload.split('\n')
  t.equal(lines.length, 7)

  console.log(lines)

  t.match(lines[0], /.?title.?,.?done.?/)
  t.match(lines[1], /.?foo.?,.?false.?/)
  t.match(lines[2], /.?bar.?,.?true.?/)
  t.match(lines[3], /.?charlie.?,.?false.?/)
  t.match(lines[4], /.?zumba.?,.?true.?/)
  t.match(lines[5], /.?manual.?,.?false.?/)
})

function getImportFileStream (filename) {
  return fs.createReadStream(path.join(__dirname, '..', 'fixtures', filename))
}

function headers (token, additionalHeaders) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      ...additionalHeaders
    }
  }
}
