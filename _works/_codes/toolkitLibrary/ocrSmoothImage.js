import sharp from 'sharp';

/**
 * Changes the pixel color values of the image object to the average color values of the surrounding pixels.
 *
 * @param {object} imageObject Image object (width, height, data)
 * @param {number} [radius=2] Range of surrounding pixels to calculate the average (default: 2px)
 * @returns {Promise<object>} Modified image object
 */
export default async function smoothImage(imageObject, radius = 2) {
    if (!imageObject || !imageObject.width || !imageObject.height || !imageObject.data) {
        throw new Error('Invalid image object.');
    }

    const width = imageObject.width;
    const height = imageObject.height;
    const originalData = imageObject.data; // Original data

    // Create image data using sharp
    const sharpImage = sharp(originalData, {
        raw: {
            width: width,
            height: height,
            channels: 3 // RGB
        }
    });

    // Access and modify pixel data
    const { data } = await sharpImage.raw().toBuffer({ resolveWithObject: true });

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            let count = 0;

            // Iterate over surrounding pixels
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    // Check image boundaries
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 3;
                        rSum += data[index];       // R
                        gSum += data[index + 1];   // G
                        bSum += data[index + 2];   // B
                        count++;
                    }
                }
            }

            // Calculate average
            const avgR = Math.round(rSum / count);
            const avgG = Math.round(gSum / count);
            const avgB = Math.round(bSum / count);

            // Update current pixel color values
            const currentIndex = (y * width + x) * 3;
            data[currentIndex] = avgR;       // R
            data[currentIndex + 1] = avgG;   // G
            data[currentIndex + 2] = avgB;   // B
        }
    }

    // Apply modified data to image object
    imageObject.data = data;

    return imageObject;
}
