export class BaseHTTPError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message)

        this.name = this.constructor.name
    }
}