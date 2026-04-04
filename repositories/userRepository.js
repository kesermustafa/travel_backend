import BaseRepository from "./BaseRepository.js";
import Users from "../model/Users.js";
import {NotFoundError} from "../errors/NotFoundError.js";


class UserRepository extends BaseRepository {
    constructor() {
        super(Users);
    }

    async findByEmail(email) {
        const doc = await this.model.findOne({ email });

        if (!doc) {
            throw new NotFoundError("User");
        }
        return doc;
    }

    async findWithPassword(id) {
        const user = await this.model.findById(id).select("+password");
        return this.throwIfNull(user);
    }

    async findByEmailWithPassword(email) {
        const user = await this.model.findOne({ email }).select("+password");
        return this.throwIfNull(user);
    }

}

export default new UserRepository();