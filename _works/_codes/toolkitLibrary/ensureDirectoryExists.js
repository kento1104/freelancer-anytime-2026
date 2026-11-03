// directoryUtils.js

import fs from 'fs/promises';

/**
 * Creates the directory if it does not exist at the specified path.
 * @param {string} directoryPath Directory path
 */
async function ensureDirectoryExists(directoryPath) {
    try {
        await fs.mkdir(directoryPath, { recursive: true });
        //console.log(`_Successfully created directory: ${directoryPath}`);
    } catch (error) {
        if (error.code === 'EEXIST') {
            // Directory already exists (not an error)
            //console.log(`_Directory already exists: ${directoryPath}`);
        } else {
            console.error(`_Error creating directory ${directoryPath}:`, error);
            throw error;
        }
    }
}

export default ensureDirectoryExists;