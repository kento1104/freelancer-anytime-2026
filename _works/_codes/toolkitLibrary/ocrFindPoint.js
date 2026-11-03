// ocrFindPoint.js

export default function ocrFindPoint(puzzlePos) {
    if (!puzzlePos || puzzlePos.length === 0) {
        throw new Error('_Array is empty.');
    }

    // Find points with the smallest x
    let minX = puzzlePos[0].x;
    for (const point of puzzlePos) {
        if (point.x < minX) {
            minX = point.x;
        }
    }

    // Among the points with the smallest x, find the point with the largest y
    let result = null;
    for (const point of puzzlePos) {
        if (point.x === minX) {
            if (!result || point.y > result.y) {
                result = point;
            }
        }
    }

    return result;
}