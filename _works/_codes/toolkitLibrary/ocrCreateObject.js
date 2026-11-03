import sharp from 'sharp';
import fs from 'fs/promises';

/**
 * Create a JavaScript object from an image file path.
 * The created object includes RGB data with the alpha channel removed.
 *
 * @param {string} imagePath Image file path
 * @returns {Promise<object>} Object containing image information (width, height, data)
 *                              data is an RGB Buffer without the alpha channel.
 * @throws {Error} File read or image processing error
 */
export default async function createImageObject(imagePath) {
    try {
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;
        const hasAlpha = metadata.hasAlpha;

        let originalBuffer;

        if (hasAlpha) {
            originalBuffer = await image.raw().toBuffer();
            // Convert RGBA -> RGB
            const rgbData = Buffer.alloc((width * height) * 3); // 3-channel RGB buffer
            for (let i = 0, j = 0; i < originalBuffer.length; i += 4, j += 3) {
                rgbData[j] = originalBuffer[i];     // R
                rgbData[j + 1] = originalBuffer[i + 1]; // G
                rgbData[j + 2] = originalBuffer[i + 2]; // B
            }
            return {
                width: width,
                height: height,
                data: rgbData,
            };
        }
        else{
            const buffer = await image
                .raw()
                .toBuffer();

            return {
                width: width,
                height: height,
                data: buffer,
            };
        }
        

        // Validation
        if (!metadata.width || !metadata.height) {
            throw new Error('_Image metadata does not contain width or height information.');
        }


    } catch (error) {
        console.error('_Image processing error:', error);
        console.error('_Error message:', error.message); // Log detailed error message
        if (error instanceof sharp.SharpError) {
            console.error('_Sharp error:', error.constructor.name, error.message); // Log SharpError information
        }

        throw new Error(`_Failed to read or process image file: ${error.message}`);
    }
}