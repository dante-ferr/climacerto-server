import type { FastifyReply, FastifyRequest } from 'fastify'
import { BaseHTTPError } from '../custom-erros/base-http-error.js'

export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    request.log.error(error)

    if (error instanceof BaseHTTPError) {
        return reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name,
            message: error.message,
            details: (error as any).details || undefined
        })
    }

    return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Ocorreu um erro inesperado no servidor."
    })
}