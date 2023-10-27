const t = require('tap');
const fcli = require('fastify-cli/helper');
const startArgs = '-l info --options app.js';

const envParam = {
    NODE_ENV: 'test',
    MONGO_URL: 'mongodb://localhost:27017/test'
}

async function buildApp(t, env = envParam, serverOptions){
    const app = await fcli.build(startArgs, {
        configData: env
    }, 
    serverOptions
    )
    t.teardown(() => app.close())

    return app
}

// t.todo allows you to list the test cases ahead of time.
// t.todo('the application should start', async() =>{})
t.test('the application should start', async(t) =>{
    const envParam = {
        NODE_ENV: 'test',
        MONGO_URL: 'mongodb://localhost:27017/test'
    }

    const app = await fcli.build(startArgs, {
        configData: envParam
    })
    t.teardown(() => { app.close() })
    await app.ready();
    t.pass('the application is ready')
})
t.test('the alive route is online', async(t) =>{
    const app = await buildApp(t);
    const response = await app.inject({
        method: 'GET',
        url: '/'
    })

    t.same(response.json(), { root: true })

})
t.todo('the application should not start', async() =>{})