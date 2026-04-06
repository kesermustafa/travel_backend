import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export const processSingleImage = async (file, folder, size = [1200, null]) => {

    const buffer = file.buffer || file;
    const mimetype = file.mimetype || 'image/jpeg';

    // 1. Dosya uzantısını belirle
    let extension = 'webp';
    if (mimetype === 'image/gif') extension = 'gif';
    if (mimetype === 'image/svg+xml') extension = 'svg';

    const filename = `${folder}-${uuidv4()}-${Date.now()}.${extension}`;
    const outputPath = `public/images/${folder}/${filename}`;

    // 2. Eğer GIF veya SVG ise Sharp ile işlem yapmadan direkt kaydet
    if (extension === 'gif' || extension === 'svg') {
        await fs.writeFile(outputPath, buffer);
        return filename;
    }

    // 3. Normal resimse (jpg, png vb.) WebP'ye çevir ve boyutlandır
    const resizeOptions = {
        fit: size[1] ? 'cover' : 'inside',
        withoutEnlargement: true
    };

    await sharp(buffer)
        .resize(size[0], size[1], resizeOptions)
        .toFormat('webp')
        .webp({ quality: 85 })
        .toFile(outputPath);

    return filename;
};


export const processMultipleImages = async (filesArray, folder, size = [800, null]) => {
    return Promise.all(
        filesArray.map(file => processSingleImage(file, folder, size))
    );
};