import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Genel Resim İşleme Fonksiyonu
 * @param {Buffer} fileBuffer - Resim verisi
 * @param {String} folder - 'users', 'tours' vb.
 * @param {Array} size - [genişlik, yükseklik]
 */
export const processSingleImage = async (fileBuffer, folder, size = [1200, null]) => {
    const filename = `${folder}-${uuidv4()}-${Date.now()}.webp`;

    // Profil resmi gibi kare isteniyorsa (size[1] doluysa) Sharp ona göre kırpar
    const resizeOptions = {
        fit: size[1] ? 'cover' : 'inside', // Yükseklik varsa alanı doldurur, yoksa en-boyu korur
        withoutEnlargement: true
    };

    await sharp(fileBuffer)
        .resize(size[0], size[1], resizeOptions)
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(`public/images/${folder}/${filename}`);

    return filename;
};

// Çoklu resim işleme (Galeri için)
export const processMultipleImages = async (filesArray, folder, size = [800, null]) => {
    return Promise.all(
        filesArray.map(file => processSingleImage(file.buffer, folder, size))
    );
};