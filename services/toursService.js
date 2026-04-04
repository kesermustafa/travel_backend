import toursRepository from "../repositories/toursRepository.js";
import {AppError} from "../errors/AppError.js";
import {ROLES} from "../constants/roles.js";

class ToursService {

   async handleTourPermission (tourId, currentUser)  {
        const tour = await toursRepository.findTourWithCreator(tourId);

        if (!tour) throw new AppError('Tur bulunamadı.', 404);

        const userRole = currentUser.role;
        const userId = currentUser.id.toString();

        // createdBy populate edilmiş olmalı (repository'de yaptığımız gibi)
        const creatorId = tour.createdBy._id.toString();
        const creatorRole = tour.createdBy.role;

        // YETKİ MATRİSİ
        // 1. ADMIN Kontrolü
        if (userRole === ROLES.ADMIN) return tour;

        // 2. LEAD_GUIDE Kontrolü
        if (userRole === ROLES.LEAD_GUIDE) {
            if (creatorId === userId || creatorRole === ROLES.GUIDE) {
                return tour;
            }
        }

        // 3. GUIDE Kontrolü
        if (userRole === ROLES.GUIDE) {
            if (creatorId === userId) {
                return tour;
            }
        }

        throw new AppError('Bu işlem için yetkiniz bulunmuyor.', 403);
    };

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

    async deleteTour  (tourId, currentUser)  {
        // Önce yetkiyi kontrol et, yetki yoksa zaten aşağıya geçmeden hata fırlatır.
        await this.handleTourPermission(tourId, currentUser);

        // Yetki tamsa silme işlemini yap.
        return await toursRepository.delete(tourId);
    };

    async updateTour (tourId, updateData, currentUser) {
       // Yetki kontrolünü yukarıdaki ortak fonksiyondan yapıyoruz
       await this.handleTourPermission(tourId, currentUser);

       // Audit bilgileri ve güvenlik
       updateData.updatedBy = currentUser.id;
       delete updateData.createdBy; // Başlangıç sahibini değiştiremez

       return await toursRepository.update(tourId, updateData);
    };


}

export default new ToursService();