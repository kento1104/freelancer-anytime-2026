import sharp from 'sharp';

/**
 * Applies noise reduction and a slight blur effect to an image object.
 * Uses a single adjustment parameter (strength) and ensures determinism.
 *
 * @param {object} imageObject Image object (width, height, data)
 * @param {number} [strength=1] Blur strength (value between 0 and 1, default: 1)
 *   Closer to 0 reduces noise, closer to 1 applies slight blur.
 * @returns {Promise<object>} Modified image object
 */
export default async function smoothImage(imageObject, strength = 1) {
    if (!imageObject || !imageObject.width || !imageObject.height || !imageObject.data) {
        throw new Error('_Invalid image object.');
    }

    if (strength < 0 || strength > 1) {
        throw new Error('_Strength value must be between 0 and 1.');
    }

    const width = imageObject.width;
    const height = imageObject.height;
    const originalData = imageObject.data;

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

    // Combination of median blur (noise reduction) and Gaussian blur (slight blur)

    const kernelSize = 3; // Median blur kernel size (fixed)
    const gaussianSigma = strength * 0.75;  // Gaussian blur sigma, adjusted by strength (0~0.75)
    const gaussianKernelSize = 3; // Gaussian blur kernel size

    // Median blur (noise reduction) - taken from existing code
    const medianBlur = (data) => {
        const newData = new Uint8Array(data);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) { // Process RGB channels
                    const pixels = [];
                    for (let ky = -Math.floor(kernelSize / 2); ky <= Math.floor(kernelSize / 2); ky++) {
                        for (let kx = -Math.floor(kernelSize / 2); kx <= Math.floor(kernelSize / 2); kx++) {
                            const nx = x + kx;
                            const ny = y + ky;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const index = (ny * width + nx) * 3 + c;
                                pixels.push(data[index]);
                            }
                        }
                    }
                    pixels.sort((a, b) => a - b);
                    const median = pixels[Math.floor(pixels.length / 2)];
                    newData[(y * width + x) * 3 + c] = median;
                }
            }
        }
        return newData;
    };

    // Gaussian blur (slight blur)
    const gaussianBlur = (data) => {
      const newData = new Uint8Array(data);
        const kernel = gaussianKernel(gaussianKernelSize, gaussianSigma);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    let pixelValue = 0;
                    let weightSum = 0;

                    for (let ky = 0; ky < gaussianKernelSize; ky++) {
                        for (let kx = 0; kx < gaussianKernelSize; kx++) {
                            const ny = y - Math.floor(gaussianKernelSize / 2) + ky;
                            const nx = x - Math.floor(gaussianKernelSize / 2) + kx;

                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const index = (ny * width + nx) * 3 + c;
                                const weight = kernel[ky][kx];
                                pixelValue += data[index] * weight;
                                weightSum += weight;
                            }
                        }
                    }
                    newData[(y * width + x) * 3 + c] = Math.round(pixelValue / weightSum);
                }
            }
        }
        return newData;
    };

    // Gaussian blur kernel generation function
    function gaussianKernel(size, sigma) {
      const kernel = Array(size).fill(null).map(() => Array(size).fill(0));
      const center = Math.floor(size / 2);
      let sum = 0;

      for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
              const dx = x - center;
              const dy = y - center;
              const distSq = dx * dx + dy * dy;
              kernel[y][x] = Math.exp(-distSq / (2 * sigma * sigma));
              sum += kernel[y][x];
          }
      }

      // Normalize
      for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
              kernel[y][x] /= sum;
          }
      }
      return kernel;
  }

    // Blending (mix median blur and Gaussian blur based on strength value)
    const medianBlurredData = medianBlur(data);
    const blurredData = gaussianBlur(medianBlurredData);  // Apply median blur first

    // Apply final result to image object
    for (let i = 0; i < data.length; i++) {
        data[i] = blurredData[i];
    }

    // Apply modified data to image object
    imageObject.data = data;

    return imageObject;
}