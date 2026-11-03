import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import ocrCreateObject from './ocrCreateObject.js';
import ocrSmoothImage from './ocrSmoothImage.js';
import ocrCompareImages from './ocrCompareImages.js';
import ocrPiecePosition from './ocrPiecePosition.js'; // Ensure this import is correct
import ocrFindPoint from './ocrFindPoint.js';
import ocrObjectToFile from './ocrObjectToFile.js';

// Puzzle piece detection function
export default async function ocrFindPuzzle(imagePath, sampleDir, tempDir) {
  //console.log('imagePath, sampleDir, tempDir',imagePath, sampleDir, tempDir)
  let targetImage = await ocrCreateObject(imagePath);
  await ocrSmoothImage(targetImage,2);
  
  const sampleFiles = await fs.readdir(sampleDir);
  for (const sample of sampleFiles) {
    let samplePath = path.join(sampleDir, sample);
    //console.log('Processing sample:', path.basename(samplePath));

    let sampleImage = await ocrCreateObject(samplePath);
    await ocrSmoothImage(sampleImage,2);

    const isMatch = await ocrCompareImages(sampleImage, targetImage);
    if (isMatch) {
      console.log('_Matching sample found:', path.basename(samplePath));

      let puzzlePos = await ocrPiecePosition(
        sampleImage, targetImage, 
        { threshold : 50, radius : 5, outputDir : tempDir});

        puzzlePos=  ocrFindPoint(puzzlePos);
      return puzzlePos;
    }
  }

  console.log('_No matching sample found');
  return null;
}
