import { BaseHTTPError } from "./base-http-error.js"

export class InternalServerError extends BaseHTTPError {
    constructor(message: string = "Erro interno do servidor") {
        super(message, 500)
    }
}