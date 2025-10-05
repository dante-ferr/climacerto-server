import { BaseHTTPError } from "./base-http-error.js"

export class BadRequestError extends BaseHTTPError {
    constructor(message: string = "Requisição inválida") {
        super(message, 400)
    }
}