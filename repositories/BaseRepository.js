import {NotFoundError} from "../errors/NotFoundError.js";
import mongoose from "mongoose";

export default class BaseRepository {
    constructor(model, entityName = null) {
        this.model = model;
        this.entityName = entityName || model.modelName;
    }

    throwIfNull(doc) {
        if (!doc) {
            throw new NotFoundError(this.entityName);
        }
        return doc;
    }

    async create(data) {
        return this.model.create(data);
    }

    async save(doc) {
        const savedDoc = await doc.save();
        return this.throwIfNull(savedDoc);
    }

    async bulkCreate(dataArray) {
        return this.model.insertMany(dataArray);
    }

    async findAll(filter = {}, options = {}) {
        let query = this.model.find(filter);

        // Middleware'deki filtreyi aşmak için options'ı sorguya ekliyoruz
        if (options.includeInactive) {
            query.setOptions({ includeInactive: true });
        }

        if (options.select) query = query.select(options.select);
        if (options.sort) query = query.sort(options.sort);
        if (options.populate) query = query.populate(options.populate);

        return await query;
    }

    async findOne(filter, options = {}) {
        let query = this.model.findOne(filter);

        if (options.select) query = query.select(options.select);
        if (options.populate) query = query.populate(options.populate);

        return await query;
    }


    async findById(id, options = {}) {

        const cleanId = id.toString().trim();

        if (!mongoose.Types.ObjectId.isValid(cleanId)) {
            throw new Error("Geçersiz ID formatı");
        }

        let query = this.model.findById(cleanId);

        if (options.select) query = query.select(options.select);
        if (options.populate) query = query.populate(options.populate);

        const doc = await query;

        return this.throwIfNull(doc);
    }

    async findByIdOrThrow(id, options = {}) {
        const doc = await this.findById(id, options);
        return this.throwIfNull(doc);
    }

    async exists(filter) {
        return this.model.exists(filter);
    }

    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }

    async findWithPagination(
        filter = {},
        {
            page = 1,
            limit = 10,
            sort = {},
            select = null,
            populate = null,
        } = {}
    ) {
        const skip = (page - 1) * limit;

        let query = this.model
            .find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort);

        if (select) query = query.select(select);
        if (populate) query = query.populate(populate);

        const data = await query;
        const total = await this.model.countDocuments(filter);

        return {
            data,
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }

    async update(id, data) {
        const doc = await this.model.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true,
        });
        return this.throwIfNull(doc);
    }

    async updateOne(filter, data) {
        const doc = await this.model.findOneAndUpdate(filter, data, {
            returnDocument: 'after',
            runValidators: true,
        });
        return this.throwIfNull(doc);
    }

    async delete(id) {
        const doc = await this.model.findByIdAndDelete(id);
        return this.throwIfNull(doc);
    }

    async deleteOne(filter) {
        const doc = await this.model.findOneAndDelete(filter);
        return this.throwIfNull(doc);
    }

    async deleteMany(filter) {
        return this.model.deleteMany(filter);
    }

    async softDelete(id) {
        if (!this.model.schema.path("isDeleted")) {
            throw new Error(`${this.entityName} does not support soft delete`);
        }

        const doc = await this.model.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { returnDocument: 'after', }
        );

        return this.throwIfNull(doc);
    }

    async restore(id) {
        if (!this.model.schema.path("isDeleted")) {
            throw new Error(`${this.entityName} does not support restore`);
        }

        const doc = await this.model.findByIdAndUpdate(
            id,
            { isDeleted: false },
            { returnDocument: 'after', }
        );

        return this.throwIfNull(doc);
    }
}