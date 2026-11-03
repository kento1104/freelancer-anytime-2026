// movePuzzle.js

/**
 * Function to move puzzle pieces and click buttons using Playwright low-level API (coordinate-based, scroll removal, speed control, mouse visualization)
 */
async function movePuzzle(movePuzzleArea, puzzlePosition, buttonArea, page) {
    if (!page) {
        throw new Error("Page object is required. Please provide a Playwright Page object.");
    }

    console.log("_movePuzzle function start");
    console.log("_movePuzzleArea:", movePuzzleArea);
    console.log("_puzzlePosition:", puzzlePosition);
    console.log("_buttonArea:", buttonArea);

    // 1. Calculate start/end positions
    const startX = movePuzzleArea.x + Math.random() * movePuzzleArea.width;
    const startY = movePuzzleArea.y + Math.random() * movePuzzleArea.height;
    const endX = startX + puzzlePosition.x;
    const endY = startY + puzzlePosition.y;

    console.log("_Start position (startX, startY):", startX, startY);
    console.log("_End position (endX, endY):", endX, endY);

    // Inject mouse movement visualization code
    // await injectMouseTracker(page);
    await page.waitForTimeout(1000); // Wait for 1 second

    // 2. Mouse movement and drag (using Playwright low-level API, speed control)
    const steps = 50;
    const delay = 250;

    await performDragAndDrop(page, startX, startY, endX, endY, steps, delay);

    // 3. Button click
    const buttonX = buttonArea.x + Math.random() * buttonArea.width;
    const buttonY = buttonArea.y + Math.random() * buttonArea.height;

    console.log("_Button click position (buttonX, buttonY):", buttonX, buttonY);
    await performMouseClick(page, buttonX, buttonY, delay * 2);

    console.log("_Puzzle move and button click completed!");
}

/**
 * Perform mouse drag and drop using Playwright's low-level API (speed control)
 * @param {object} page Playwright Page object
 * @param {number} startX Start x coordinate
 * @param {number} startY Start y coordinate
 * @param {number} endX End x coordinate
 * @param {number} endY End y coordinate
 * @param {number} steps Number of movement steps
 * @param {number} delay Delay between each step (ms)
 */
async function performDragAndDrop(page, startX, startY, endX, endY, steps, delay) {
    console.log(`_performDragAndDrop: (${startX}, ${startY}) -> (${endX}, ${endY}), steps=${steps}, delay=${delay}`);

    await page.mouse.move(startX, startY, { steps: 1, force: true }); // Move to start position (immediate move with step 1)
    await page.mouse.down({force: true});

    const stepX = (endX - startX) / steps;
    const stepY = (endY - startY) / steps;

    for (let i = 1; i <= steps; i++) {
        const currentX = startX + stepX * i;
        const currentY = startY + stepY * i;
        await page.mouse.move(currentX, currentY, { steps: 1, force: true }); // Immediate move at each step
        await page.waitForTimeout(delay / steps);  // Delay at each step
    }
    await page.waitForTimeout(delay / steps);
    await page.mouse.up({force: true});
}

/**
 * Perform mouse click using Playwright's low-level API (speed control)
 * @param {object} page Playwright Page object
 * @param {number} x x coordinate to click
 * @param {number} y y coordinate to click
 * @param {number} delay Delay before and after click (ms)
 */
async function performMouseClick(page, x, y, delay) {
    console.log(`_performMouseClick: (${x}, ${y}), delay=${delay}`);
    await page.mouse.move(x, y, { steps: 1, force: true }); // Move to click position
    await page.waitForTimeout(delay); // Delay before click
    await page.mouse.click(x, y, {force: true, delay: 10});
    await page.waitForTimeout(delay); // Delay after click
}

/**
 * Function to inject mouse movement visualization code
 */
async function injectMouseTracker(page) {
    await page.evaluate(() => {
        if (window.hasMouseTracker) return;
        window.hasMouseTracker = true;

        const tracker = document.createElement('div');
        tracker.style.width = '16px';
        tracker.style.height = '16px';
        tracker.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        tracker.style.borderRadius = '8px';
        tracker.style.position = 'absolute';
        tracker.style.pointerEvents = 'none';
        tracker.style.zIndex = '9999';
        document.body.appendChild(tracker);

        document.addEventListener('mousemove', (event) => {
            tracker.style.left = (event.clientX - 8) + 'px';
            tracker.style.top = (event.clientY - 8) + 'px';
        });
    });
    console.log("_Mouse movement visualization code injected");
}

export default movePuzzle;