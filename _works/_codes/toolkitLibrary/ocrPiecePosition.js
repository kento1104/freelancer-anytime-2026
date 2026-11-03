import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import ocrDrawCircle from './ocrDrawCircle.js';
import ocrObjectToFile from './ocrObjectToFile.js';
import ocrFilterColor from './ocrFilterColor.js';

/**
 * Finds the differences between the sample image and the target image, returns the positions, and saves the highlighted differences.
 * In this case, it finds the area with the puzzle piece.
 */
export default async function ocrPiecePosition(sampleImage, targetImage, options = {}) {
    const { threshold = 50, radius = 5, outputDir = 'temp' } = options; // Adjust threshold value

    // Validate input
    if (!sampleImage || !sampleImage.width || !sampleImage.height || !sampleImage.data ||
        !targetImage || !targetImage.width || !targetImage.height || !targetImage.data) {
        throw new Error('Invalid image object.');
    }
    if (sampleImage.width !== targetImage.width || sampleImage.height !== targetImage.height) {
        throw new Error('Image sizes are different.');
    }

    // await ocrObjectToFile(sampleImage, path.join(outputDir, `sample_2_ocrSmoothImage.png`));
    // await ocrObjectToFile(targetImage, path.join(outputDir, `target_2_ocrSmoothImage.png`));

    const width = sampleImage.width;
    const height = sampleImage.height;
    const diffLocations = [];

    await fs.mkdir(outputDir, { recursive: true });

    const sampleImageBuffer = Buffer.from(sampleImage.data);
    const targetImageBuffer = Buffer.from(targetImage.data);

    // Convert to image data using sharp
    const { data: targetImageData } = await sharp(targetImageBuffer, { raw: { width, height, channels: 3 } })
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data: sampleImageData } = await sharp(sampleImageBuffer, { raw: { width, height, channels: 3 } })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Color the puzzle piece area and save the position
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 3; // 3 means RGB channels

            const r1 = sampleImageData[index];
            const g1 = sampleImageData[index + 1];
            const b1 = sampleImageData[index + 2];

            const r2 = targetImageData[index];
            const g2 = targetImageData[index + 1];
            const b2 = targetImageData[index + 2];

            // Calculate Euclidean distance
            // const distance = Math.sqrt(
            //     Math.pow(r1 - r2, 2) +
            //     Math.pow(g1 - g2, 2) +
            //     Math.pow(b1 - b2, 2)
            // );
            const distance = (
                Math.abs(r1 - r2) +
                Math.abs(g1 - g2) +
                Math.abs(b1 - b2)
            );

            // Consider as puzzle piece area if distance is greater than threshold
            if (distance > threshold) {  // Determine as difference if greater than threshold

                const sum1 = r1 + g1 + b1;
                const sum2 = r2 + g2 + b2;

                if (sum1 < sum2) {
                    // Color the position red
                    targetImageData[index] = 255; // R
                    targetImageData[index + 1] = 0;   // G
                    targetImageData[index + 2] = 0;   // B
                    // diffLocations.push({ x, y });                    
                }

            }
        }
    }

    const diffImageObject = {
        width: targetImage.width,
        height: targetImage.height,
        data: Buffer.from(targetImageData)
    };
    // Save the highlighted differences to a file
    const timestamp = `${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await ocrObjectToFile(diffImageObject, path.join(outputDir, timestamp + `_zdiff.png`));
    await ocrFilterColor(diffImageObject, 4, 12, { r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    await ocrFilterColor(diffImageObject, 12, 50, { r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });

    await ocrObjectToFile(sampleImage, path.join(outputDir, timestamp + `_smooth_sample.png`));
    await ocrObjectToFile(targetImage, path.join(outputDir, timestamp + `_smooth_target.png`));
    await ocrObjectToFile(diffImageObject, path.join(outputDir, timestamp + `_zfilterdiff.png`));

    // Iterate over each point in diffImageObject and add positions with {255, 0, 0} color to diffLocations
    for (let y = 0; y < diffImageObject.height; y++) {
        for (let x = 0; y < diffImageObject.width; x++) {
            const index = (y * diffImageObject.width + x) * 3; // 3 means RGB channels

            const r = diffImageObject.data[index];
            const g = diffImageObject.data[index + 1];
            const b = diffImageObject.data[index + 2];

            if (r > 250 && g < 5 && b < 5) {
                diffLocations.push({ x, y });
            }
        }
    }

    // Return array of positions where differences were found
    return diffLocations;
}