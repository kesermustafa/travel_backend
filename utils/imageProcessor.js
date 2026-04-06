import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid'; // Benzersiz isimler için: npm install uuid

/**
 * Resmi boyutlandırır ve belirtilen klasöre kaydeder.
 * @param {Buffer} buffer - Resmin ham verisi
 * @param {String} folder - Kaydedilecek klasör yolu (örn: 'tours')
 * @param {Array} size - [genişlik, yükseklik] (örn: [500, 500])
 */
export const processAndSaveImage = async (buffer, folder, size = [500, 500]) => {
    // Uzantıyı her zaman .webp yapıyoruz
    const filename = `${folder}-${uuidv4()}-${Date.now()}.webp`;
    const path = `public/images/${folder}/${filename}`;

    await sharp(buffer)
        .resize(size[0], size[1], {
            fit: 'cover',
            position: 'center'
        })
        .toFormat('webp') // Formatı WebP'ye zorla
        .webp({ quality: 85 }) // %85 kalite WebP için idealdir
        .toFile(path);

    return filename;
};