// directoryUtils.js

import fs from 'fs/promises';
import path from 'path';

/**
 * Asynchronously gets the list of immediate subdirectories.
 * @param {string} directoryPath Directory path
 * @returns {Promise<string[]>} Array of subdirectory paths
 */
export async function getSubdirectories(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath, { withFileTypes: true });
        return files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => path.join(directoryPath, dirent.name));
    } catch (error) {
        console.error(`_Error reading directory ${directoryPath}:`, error);
        return [];
    }
}

/**
 * Checks if there is a first-level directory containing a specific substring in its name. (Sequential processing)
 * @param {string} workspaceDirectory Workspace directory path
 * @param {string} searchString Substring to search for
 * @returns {Promise<boolean>} Returns true if the directory is found, otherwise false
 */
export default async function directoryExistsWithSubstring(workspaceDirectory, searchString) {
    const subdirectories = await getSubdirectories(workspaceDirectory);

    for (const subdirectory of subdirectories) {
        try {
            if (path.basename(subdirectory).includes(searchString)) {
            //if (path.basename(subdirectory).endsWith(searchString)) {
                return true; // Return true immediately if found
            }
        } catch (error) {
            console.error(`_Error processing directory ${subdirectory}:`, error);
        }
    }

    return false; // Return false if not found
}