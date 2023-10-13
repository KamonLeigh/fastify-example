'use strict'

module.exports = async function(fastify, _opts){
    fastify.route({
        method: 'GET',
        url: '/',
        schema:{
            querystring: fastify.getSchema('schema:todo:list:query'),
            response: {
                200: fastify.getSchema('schema:todo:list:response')
            }

        },
        handler: async function listTodo(request, reply) {
         const {skip, limit, title} =  request.query;
         const filter = title ? { title: new RegExp(title, i)} : {}

         const data = await this.todos.find(filter, {
            limit,
            skip
         })
         .toArray()

         const totalCounts = await this.todos.countDocuments(filter);

         return { data, totalCounts}
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:todo:create:body'),
            response: {
                201: fastify.getSchema('schema:todo:create:response')
            }
        },
        handler: async function createTodo(request, reply) {
            const _id = new this.mongo.ObjectId();
            const now = new Date();
            const createdAt = now;
            const modifiedAt = now;
            const done = false;

            const newTodo = {
                _id,
                id: _id,
                ...request.body,
                createdAt,
                modifiedAt,
                done
            }

            await this.todos.insertOne(newTodo);
            reply.code(201);

            return { id: _id }
        }
    })


    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:todo:read:params'),
            response: {
                200: fastify.getSchema('schema:todo')
            }
        },
        handler: async function readTodo(request, reply) {
            const todo = await this.todos.findOne({
                _id: new this.mongo.ObjectId(request.params.id)
            }, { projection: { _id: 0 }})

            if(!todo) {
                reply.code(404)
                return { error: 'Todo not found'}
            }

            return todo
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:todo:read:params'),
            body: fastify.getSchema('schema:todo:update:body')
        },
        handler: async function updateTodo(request, reply) {
               const res = await this.todos.updateOne({ 
                _id: new this.mongo.ObjectId(request.params.id)},
                {
                    $set: {
                        ...request.body,
                        modifiedAt: new Date()
                    }
                }
            )

            if (res.modifiedCount === 0) {
                reply.code(404)
                return { error: 'Todo not found'}
            }

            reply.code(204)
            
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:todo:read:params')
        },
        handler: async function deleteTodo(request, reply) {
            const res = await this.todos.deleteOne({ _id: new fastify.mongo.ObjectId(request.params.id)});
            if(res.deletedCount === 0) {
                reply.code(404);
                return { error: "Todo not found"}
            }

            reply.code(204)
        }
    })

    fastify.route({
        method: 'POST',
        url: '/:id/:status',
        schema: {
            params: fastify.getSchema('schema:todo:status:params')
        },
        handler: async function changeStatus(request, reply) {
            const done = request.params.status === 'done';

            const res = await this.todos.updateOne(
                {
                    _id: new this.mongo.ObjectId(request.params.id)
                },{
                    $set: {
                        done,
                        modifiedAt: new Date()
                    }
                }
            )

            if(res.modifiedCount === 0) {
                reply.code(404)
                return { error: 'Todo not found'}
            }

            reply.code(204)
        }
    })
}