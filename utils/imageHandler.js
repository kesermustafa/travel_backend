import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tek bir resmi işleyip kaydeder.
 */
export const processSingleImage = async (fileBuffer, folder, size = [1200, 800]) => {
    const filename = `${folder}-${uuidv4()}-${Date.now()}.webp`;

    await sharp(fileBuffer)
        .resize(size[0], size[1])
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(`public/images/${folder}/${filename}`);

    return filename;
};

/**
 * Birden fazla resmi (Galeri) paralel olarak işler.
 */
export const processMultipleImages = async (filesArray, folder, size = [1200, 800]) => {
    // Tüm işlemleri aynı anda başlatıp bitmesini bekliyoruz (Hız için)
    return Promise.all(
        filesArray.map(file => processSingleImage(file.buffer, folder, size))
    );
};