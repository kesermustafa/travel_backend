import BaseRepository from "./BaseRepository.js";
import Tours from "../model/Tours.js";

class ToursRepository extends BaseRepository {
    constructor() {
        super(Tours);
    }

    async createTour(tourData) {
        // 'this.module' değil, Base'de tanımladığın 'this.model' olmalı
        const newTour = await this.model.create(tourData);

        // Kayıttan sonra populate ederek döndür
        return await this.model.findById(newTour._id)
            .populate({ path: 'createdBy', select: 'name photo' })
            .populate({ path: 'guides', select: 'name photo' });
    }

    async findById(id) {
        return await this.model.findById(id).populate({
            path: 'guides createdBy',
            select: 'name photo role'
        })

    }

    // Base'deki metodu override ediyoruz
    async findWithPagination(filter, options) {
        // Eğer dışarıdan populate gelmemişse varsayılanı ayarla
        if (!options.populate) {
            options.populate = [
                { path: 'createdBy', select: 'name photo' },
                { path: 'guides', select: 'name photo' }
            ];
        }

        return super.findWithPagination(filter, options);
    }

    // Yetki kontrolü için createdBy bilgisinin rolüyle birlikte gelmesi şart
    async findTourWithCreator(id) {
        return await this.model.findById(id).populate({
            path: 'createdBy',
            select: 'role _id'
        });
    }

    async removeImage(tourId, filename) {
        return await this.model.findByIdAndUpdate(
            tourId,
            { $pull: { images: filename } },
            { returnDocument: 'after', runValidators: true }
        );
    }
}

export default new ToursRepository();