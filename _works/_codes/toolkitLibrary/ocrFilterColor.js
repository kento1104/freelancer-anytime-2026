import sharp from 'sharp';

/**
 * In the image object, if a specific color (Red) exists within the specified radius and meets the threshold count, keep the pixel; otherwise, change it to white.
 *
 * @param {object} imgObject Image object (width, height, data)
 * @param {number} radius Search radius
 * @param {number} number Threshold count (Red color must meet or exceed this count to be retained)
 * @param {object} Red {r: number, g: number, b: number} Target color (Red)
 * @param {object} White {r: number, g: number, b: number} Color to change to (White)
 * @returns {Promise<object>} Modified image object
 */
export default async function processImage(imgObject, radius, number, Red, White) {
    if (!imgObject || !imgObject.width || !imgObject.height || !imgObject.data) {
        throw new Error('_Invalid image object.');
    }

    const width = imgObject.width;
    const height = imgObject.height;
    const originalData = imgObject.data;

    // Generate image data using sharp (unnecessary but kept for consistency with existing code)
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
            const currentIndex = (y * width + x) * 3;
            const r = data[currentIndex];
            const g = data[currentIndex + 1];
            const b = data[currentIndex + 2];

            // Check if the current pixel is Red
            if (Math.abs(r - Red.r)<5 && Math.abs(g - Red.g)<5 && Math.abs(b - Red.b)<5) {
                let redCount = 0;

                // Count Red pixels within the radius
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const neighborIndex = (ny * width + nx) * 3;
                            const neighborR = data[neighborIndex];
                            const neighborG = data[neighborIndex + 1];
                            const neighborB = data[neighborIndex + 2];

                            if (neighborR === Red.r && neighborG === Red.g && neighborB === Red.b) {
                                redCount++;
                            }
                        }
                    }
                }

                // Change color based on threshold count
                if (redCount >= number) {
                    // Retain Red color (do nothing)
                } else {
                    data[currentIndex] = White.r;
                    data[currentIndex + 1] = White.g;
                    data[currentIndex + 2] = White.b;
                }
            } // Do nothing if not Red color (retain original color)
        }
    }

    // Apply modified data to image object
    imgObject.data = data;

    return imgObject;
}