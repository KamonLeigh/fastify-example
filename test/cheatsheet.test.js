const t = require('tap')

t.test('a test description', t => {
  t.plan(1)
  const myVar = 42
  t.equal(myVar, 42, 'this number is 42')
})
