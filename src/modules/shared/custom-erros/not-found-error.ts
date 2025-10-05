import { BaseHTTPError } from "./base-http-error.js"

export class NotFoundError extends BaseHTTPError {
    constructor(message: string = "Recurso não encontrado") {
        super(message, 404)
    }
}