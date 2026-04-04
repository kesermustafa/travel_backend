import toursRepository from "../repositories/toursRepository.js";

class ToursService {

    async createTour(tourData, userId) {
        // 1) Turu oluşturan admin bilgisini veriye ekle
        const finalTourData = {
            ...tourData,
            createdBy: userId
        };

        // 2) Repository üzerinden kaydet
        const newTour = await toursRepository.createTour(finalTourData);

        return newTour;
    }

    async getPagedTours(queryData) {

        const {
            formatedQuery,
            formatedPage,
            formatedLimit,
            formatedSort,
            formatedSelect
        } = queryData;

        const result = await toursRepository.findWithPagination(
            formatedQuery,
            {
                page: formatedPage,
                limit: formatedLimit,
                sort: formatedSort,
                select: formatedSelect

            }
        );

        return result;
    }



}

export default new ToursService();