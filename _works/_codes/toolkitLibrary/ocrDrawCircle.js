// ocrDrawCircle.js
import sharp from 'sharp';

/**
 * Draw a circle at a specific position on the image object.
 *
 * @param {object} imageObject Image object. Must include width, height, and data properties.
 * @param {number} x x coordinate of the circle center
 * @param {number} y y coordinate of the circle center
 * @param {number} radius Radius of the circle
 */
export default async function ocrDrawCircle(imageObject, x, y, radius) {
    const { width, height, data: imageBuffer } = imageObject;

    if (!width || !height || !imageBuffer) {
        throw new Error('_Invalid image object. Must include width, height, and data properties.');
    }

    // Create RGBA buffer (to draw a transparent circle)
    const overlay = Buffer.alloc(width * height * 4, 0);

    // Draw circle
    for (let i = Math.max(0, x - radius); i <= Math.min(width - 1, x + radius); i++) {
        for (let j = Math.max(0, y - radius); j <= Math.min(height - 1, y + radius); j++) {
            if ((i - x) * (i - x) + (j - y) * (j - y) <= radius * radius) {
                const index = (j * width + i) * 4; // RGBA index calculation
                overlay[index] = 255;   // Red
                overlay[index + 1] = 0; // Green
                overlay[index + 2] = 0;   // Blue
                overlay[index + 3] = 255; // Alpha (Fully opaque)
            }
        }
    }

    try {
        // Composite image using sharp
        const resultBuffer = await sharp(imageBuffer, { raw: { width, height, channels: 3 } }) // Set input image
            .composite([{
                input: overlay,
                raw: {
                    width: width,
                    height: height,
                    channels: 4  // RGBA
                },
                blend: 'over' // Overlay on top of existing image
            }])
            .toBuffer(); // Return result image as Buffer

        // Return in the same format as the original image object
        return {
            width: width,
            height: height,
            data: resultBuffer,
        };

    } catch (error) {
        console.error("_Sharp error:", error);
        throw error; // Rethrow error to be handled by the upper function
    }
}