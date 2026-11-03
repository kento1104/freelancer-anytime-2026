import sharp from 'sharp';
import path from 'path';

/**
 * Crops a specific area of an image file and saves it as a new file.
 *
 * @param {string} imagePath - Original image file path
 * @param {object} cropArea - Information about the area to be cropped. Format: { x: number, y: number, width: number, height: number }
 * @returns {Promise<string>} New path of the cropped image file. Throws an error if the operation fails.
 */
const cropImage = async (imagePath, cropArea) => {
  try {
    // Extract image file information (extension, filename)
    const { dir, name, ext } = path.parse(imagePath);
    const croppedFileName = `${name}_cropped${ext}`;
    const croppedFilePath = path.join(dir, croppedFileName);

    // Crop the image using Sharp
    await sharp(imagePath)
      .extract({
        left: cropArea.x,
        top: cropArea.y,
        width: cropArea.width,
        height: cropArea.height,
      })
      .toFile(croppedFilePath);

    return croppedFilePath;

  } catch (error) {
    console.error('_Failed to crop image:', error);
    throw error;
  }
};

export default cropImage;

// Usage example (test)
/*
(async () => {
  const imagePath = './test.jpg'; // Change to the actual image file path.
  const cropArea = { x: 100, y: 50, width: 200, height: 150 };

  try {
    const croppedImagePath = await cropImage(imagePath, cropArea);
    console.log('_Cropped image file path:', croppedImagePath);
  } catch (error) {
    console.error('_Error occurred while processing image cropping:', error);
  }
})();
*/