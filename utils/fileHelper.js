import fs from 'fs';
import path from 'path';

/**
 * Verilen dosya adını sunucudaki klasörden siler.
 * @param {String} folder - 'tours' veya 'users' gibi klasör adı
 * @param {String} filename - Silinecek dosyanın adı (örn: tour-abc-123.webp)
 */
export const deleteFile = (folder, filename) => {
    if (!filename || filename === 'default.webp') return; // Varsayılan resmi silme

    const filePath = path.join('public', 'images', folder, filename);

    // Dosya var mı kontrol et ve sil
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Dosya silinemedi: ${filePath}`, err);
        } else {
            console.log(`Dosya başarıyla silindi: ${filePath}`);
        }
    });
};