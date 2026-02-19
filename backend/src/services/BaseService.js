class BaseService {
    constructor(model) {
        this.model = model;
    }

    async findAll(filter = {}, sort = { createdAt: -1 }) {
        return await this.model.find(filter).sort(sort);
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async create(data) {
        return await this.model.create(data);
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    async delete(id) {
        const doc = await this.model.findById(id);
        if (!doc) return null;
        await doc.deleteOne();
        return doc;
    }
}

module.exports = BaseService;
