import {AppError} from "./AppError.js";

export class NotFoundError extends AppError {
    constructor(entity) {
        super(`${entity} not found`, 404);
    }
}