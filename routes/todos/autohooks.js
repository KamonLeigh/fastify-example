'use strict'

const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')
module.exports = fp(async function todoAutoHooks (fastify, _opts) {
  const todos = fastify.mongo.db.collection('todos')
  fastify.register(schemas)

  // fastify.register(todos)
  fastify.decorate('todos', todos)
  fastify.decorateRequest('todosDataSource', null)
  // This is a speed optimaisatio: making the application aware of the existence of the
  // existence of the todosDataSource property at the beginning of request life cycle will
  // its creation faster

  fastify.addHook('onRequest', async (request, reply) => {
    request.todosDataSource = {
      async countTodos (filter = {}) {
        filter.userId = request.user.id
        const totalCounts = await todos.countDocuments(filter)
        return totalCounts
      },
      async listTodo ({
        filter = {},
        projection = {},
        skip = 0,
        limit = 50,
        asStream
      } = {}) {
        if (filter.title) {
          filter.title = new RegExp(filter.title, 'i')
        } else {
          delete filter.title
        }

        filter.userId = request.user.id

        const cursor = todos
          .find(filter, {
            projection: { ...projection, _id: 0 },
            limit,
            skip
          })

        if (asStream) {
          return cursor.stream()
        }

        return cursor.toArray()
      },
      async createTodos (todoList) {
        const now = new Date()
        const userId = request.user.id

        const toInsert = todoList.map(rawTodo => {
          const _id = new fastify.mongo.ObjectId()

          return {
            _id,
            userId,
            id: _id,
            ...rawTodo,
            createdAt: now,
            modifiedAt: now
          }
        })

        await todos.insertMany(toInsert)

        return toInsert.map((todo) => ({ id: todo._id }))
      },
      async readTodo (id, projection = {}) {
        const todo = await todos.findOne({
          _id: new fastify.mongo.ObjectId(id), userId: request.user.id
        }, { projection: { ...projection, _id: 0 } })

        return todo
      },
      async updateTodo (id, body) {
        const res = await todos.updateOne({
          _id: new fastify.mongo.ObjectId(id),
          userId: request.user.id
        },

        {
          $set: {
            ...body,
            modifiedAt: new Date()
          }
        }
        )
        return res
      },
      async deleteTodo (id) {
        const res = await todos.deleteOne({ _id: new fastify.mongo.ObjectId(id), userId: request.user.id })
        return res
      },
      async createTodo ({ title }) {
        const _id = new fastify.mongo.ObjectId()
        const now = new Date()
        const userId = request.user.id

        const { insertedId } = await todos.insertOne({
          _id,
          userId,
          title,
          id: _id,
          createdAt: now,
          modifiedAt: now,
          done: false
        })

        return insertedId
      }

    }
  })
}, {
  encapsulate: true,
  dependencies: ['@fastify/mongodb'],
  name: 'todo-store'
})
