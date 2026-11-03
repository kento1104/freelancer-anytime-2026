import sharp from 'sharp';
import path from 'path';

/**
 * Saves the image object to a specified file path.
 */
async function saveImageObject(imageObject, filePath) {
    const { width, height, data } = imageObject;

    if (!width || !height || !data) {
        throw new Error('Invalid image object. width, height, and data properties are required.');
    }

    try {
        // Save image file using sharp
        await sharp(data, { raw: { width, height, channels: 3 } }) // channels: 3 means RGB
            .toFile(filePath);

        console.log(`_Image saved to ` + path.basename(filePath) + `.`);
    } catch (error) {
        console.error('_Image save error:', error);
        throw new Error(`Failed to save image: ${error.message}`);
    }
}

export default saveImageObject;