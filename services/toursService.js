import toursRepository from "../repositories/toursRepository.js";
import {AppError} from "../errors/AppError.js";
import {ROLES} from "../constants/roles.js";
import {deleteFile} from "../utils/fileImageDeleteHelper.js";

class ToursService {

   async handleTourPermission (tourId, currentUser)  {
        const tour = await toursRepository.findTourWithCreator(tourId);

        if (!tour) throw new AppError('Tur bulunamadı.', 404);

       if (!tour.createdBy) {
           throw new AppError('Turu oluşturan kullanıcı bilgisine ulaşılamadı.', 400);
       }

       const userRole = currentUser.role;
       const userId = currentUser.id.toString();
       const creatorId = tour.createdBy._id.toString(); // Artık güvenli
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

    async deleteTour(tourId, currentUser) {
        // 1. Yetki kontrolü ve turu çekme
        const tour = await this.handleTourPermission(tourId, currentUser);

        // 2. Fiziksel dosyaları diskten temizle
        if (tour.imageCover) deleteFile('tours', tour.imageCover);
        if (tour.images && tour.images.length > 0) {
            tour.images.forEach(img => deleteFile('tours', img));
        }

        // 3. Veritabanından sil
        return await toursRepository.delete(tourId);
    };

    async deleteImage(tourId, filename, currentUser) {
        // 1. Yetki kontrolü (Kendi turu mu veya Admin mi?)
        await this.handleTourPermission(tourId, currentUser);

        // 2. Repository'den DB güncellemesini yap
        const updatedTour = await toursRepository.removeImage(tourId, filename);

        if (!updatedTour) throw new AppError('Tur bulunamadı.', 404);

        // 3. Fiziksel dosyayı diskten yok et
        deleteFile('tours', filename);

        return updatedTour;
    }

    async updateTour (tourId, updateData, currentUser) {
       // Yetki kontrolünü yukarıdaki ortak fonksiyondan yapıyoruz
        const oldTour = await this.handleTourPermission(tourId, currentUser);

        if (updateData.imageCover && oldTour.imageCover) {
            deleteFile('tours', oldTour.imageCover);
        }

       // Audit bilgileri ve güvenlik
       updateData.updatedBy = currentUser.id;
       delete updateData.createdBy; // Başlangıç sahibini değiştiremez

       return await toursRepository.update(tourId, updateData);
    };

    async getSingleTour(id) {
        // 1. Repository'den temel veriyi çek
        const tour = await toursRepository.findById(id);

        if (!tour) return null;

        // 2. Yorumları populate et (İş mantığı: Sadece son 5 yorumu getir)
        await tour.populate({
            path: 'reviews',
            select: '-tour -__v',
            options: { limit: 5, sort: { createdAt: -1 } },
            populate: {
                path: 'user',
                select: 'name photo'
            }
        });

        // 3. Ekstra iş mantığı
        //  Turun kontenjanı dolmuş mu?
        // tour.isFull = tour.guides.length >= tour.maxGroupSize;

        return tour;
    }



}

export default new ToursService();