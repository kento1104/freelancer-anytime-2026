import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Puzzle piece detection function
async function findPuzzlePiece(imagePath) {
    try {
        // 1. Load image and create canvas
        const image = await loadImage(imagePath);
        const canvas = createCanvas(360, 400);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 360, 400);

        const imageData = ctx.getImageData(0, 0, 360, 400);
        const data = imageData.data;

        // 2. Define color range (based on HSV - dark part of the puzzle piece)
        const lowerHSV = [0, 0, 0];         // Black
        const upperHSV = [180, 255, 50];   // Dark colors

        function rgbToHsv(r, g, b) {
            let h, s, v;
            r /= 255, g /= 255, b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            v = max;

            const delta = max - min;
            if (delta === 0) {
                h = s = 0;
            } else {
                s = delta / max;
                let hue;
                if (r === max) {
                    hue = (g - b) / delta;
                } else if (g === max) {
                    hue = 2 + (b - r) / delta;
                } else {
                    hue = 4 + (r - g) / delta;
                }
                hue *= 60;
                if (hue < 0) {
                    hue += 360;
                }
                h = hue;
            }
            return [h, s * 255, v * 255];
        }

        function isWithinHSVRange(r, g, b) {
            const [h, s, v] = rgbToHsv(r, g, b);
            return (
                lowerHSV[0] <= h && h <= upperHSV[0] &&
                lowerHSV[1] <= s && s <= upperHSV[1] &&
                lowerHSV[2] <= v && v <= upperHSV[2]
            );
        }

        // 3. Contour detection function (4-directional connection, non-recursive)
        function findContour(x, y, colorData) {
            const contour = [];
            const visited = new Set();
            const queue = [[x, y]];

            while (queue.length > 0) {
                const [cx, cy] = queue.shift();
                if (cx < 0 || cx >= 360 || cy < 0 || cy >= 400 || visited.has(`${cx},${cy}`)) {
                    continue;
                }
                const index = (cy * 360 + cx) * 4;
                const r = colorData[index];
                const g = colorData[index + 1];
                const b = colorData[index + 2];

                if (!isWithinHSVRange(r, g, b)) {
                    continue;
                }
                visited.add(`${cx},${cy}`);
                contour.push([cx, cy]);

                // 4-directional connection (up, down, left, right)
                queue.push([cx + 1, cy]);
                queue.push([cx - 1, cy]);
                queue.push([cx, cy + 1]);
                queue.push([cx, cy - 1]);
            }
            return contour;
        }

        // 4. Detect puzzle pieces and calculate positions
        let puzzle = null;
        let position = null;
        const minPuzzleSize = 20;  // Minimum contour size
        const puzzleEdgeTolerance = 10; // Tolerance for detecting puzzle pieces near the top-left corner

        for (let y = 0; y < 400; y++) {
            for (let x = 0; x < 360; x++) {
                const index = (y * 360 + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (isWithinHSVRange(r, g, b)) {
                    const contour = findContour(x, y, data);

                    if (contour.length >= minPuzzleSize) {
                        let minX = 360;
                        let minY = 400;
                        let maxX = -1;
                        let maxY = -1;

                        for (const [cx, cy] of contour) {
                            minX = Math.min(minX, cx);
                            minY = Math.min(minY, cy);
                            maxX = Math.max(maxX, cx);
                            maxY = Math.max(maxY, cy);
                        }

                        const width = maxX - minX + 1;
                        const height = maxY - minY + 1;

                        // 5. Distinguish between puzzle and position and compare sizes
                        if (minX < puzzleEdgeTolerance && minY < puzzleEdgeTolerance) { // Near the top-left corner
                            if (!puzzle || (width * height) > (puzzle.width * puzzle.height)) {
                                puzzle = { x: minX, y: minY, width: width, height: height };
                            }
                        } else { // Others (position)
                            if (!position || (width * height) > (position.width * position.height)) {
                                position = { x: minX, y: minY, width: width, height: height };
                            }
                        }
                    }
                }
            }
        }

        // 6. Return results
        return { puzzle, position };

    } catch (error) {
        console.error("_Error processing image:", error);
        return null;
    }
}

// Export function
export default findPuzzlePiece;