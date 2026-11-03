import { PNG } from 'pngjs';

/**
 * Compare two image objects to determine similarity.
 *
 * @param {object} image1 First image object (width, height, data)
 * @param {object} image2 Second image object (width, height, data)
 * @param {object} [options] Comparison options (optional)
 * @param {number} [options.gridX=4] Number of comparison points in the horizontal direction (default: 4)
 * @param {number} [options.gridY=4] Number of comparison points in the vertical direction (default: 4)
 * @param {number} [options.threshold=10] Pixel value difference threshold (default: 30)
 * @param {number} [options.maxDifferentPoints=3] Maximum number of different points (default: 3)
 * @returns {boolean} true if the images are similar, false otherwise
 */
export default function compareImages(image1, image2, options = {}) {
    const {
        gridX = 4,
        gridY = 4,
        threshold = 30,
        maxDifferentPoints = 3,
    } = options;

    // Validation
    if (!image1 || !image1.width || !image1.height || !image1.data ||
        !image2 || !image2.width || !image2.height || !image2.data) {
        throw new Error('_Invalid image object.');
    }

    if (image1.width !== image2.width || image1.height !== image2.height) {
        console.warn('_Image sizes are different. Comparison accuracy may be reduced.');
        // In case of different sizes, you can perform a stricter comparison or return false.
    }

    let differentPoints = 0;

    // Calculate comparison point positions
    for (let i = 0; i < gridX; i++) {
        for (let j = 0; j < gridY; j++) {
            const x1 = Math.floor((i / (gridX - 1)) * image1.width);
            const y1 = Math.floor((j / (gridY - 1)) * image1.height);
            const x2 = Math.floor((i / (gridX - 1)) * image2.width);
            const y2 = Math.floor((j / (gridY - 1)) * image2.height);

            // Compare pixel values
            const index1 = (y1 * image1.width + x1) * 4;
            const index2 = (y2 * image2.width + x2) * 4;

            const r1 = image1.data[index1];
            const g1 = image1.data[index1 + 1];
            const b1 = image1.data[index1 + 2];

            const r2 = image2.data[index2];
            const g2 = image2.data[index2 + 1];
            const b2 = image2.data[index2 + 2];

            const diffR = Math.abs(r1 - r2);
            const diffG = Math.abs(g1 - g2);
            const diffB = Math.abs(b1 - b2);

            // Check if the difference exceeds the threshold
            if (diffR > threshold || diffG > threshold || diffB > threshold) {
                differentPoints++;
            }

            // If the number of different points exceeds the threshold, terminate immediately
            if (differentPoints > maxDifferentPoints) {
                return false; // Different images
            }
        }
    }

    return true; // Similar images
}