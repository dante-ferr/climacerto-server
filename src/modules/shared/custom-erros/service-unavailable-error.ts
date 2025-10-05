import { BaseHTTPError } from "./base-http-error.js";

export class ServiceUnavailableError extends BaseHTTPError {
    constructor(message: string = "Serviço indisponível no momento") {
        super(message, 503);
    }
}