import fs from 'fs';
import path from 'path';


export default function getConcatedTextsinFolder(directoryPath) {
    try {
        // Read file list in directory
        const files = fs.readdirSync(directoryPath);

        // Sort in Windows Explorer order
        const sortedFiles = files
            .filter(file => file.endsWith('.txt') || file.endsWith('.json')) // Filter .txt and .json files
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        // Concatenate file contents into a single string
        let result = '';
        sortedFiles.forEach(file => {
            const filePath = path.join(directoryPath, file);
            let content;

            if (file.endsWith('.json')) {
                // For JSON files, convert JSON to string
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                content = JSON.stringify(jsonData, null, 2); // Improve readability with indentation
            } else {
                // For .txt files, read content as is
                content = fs.readFileSync(filePath, 'utf-8');
            }

            result += content + '\n'; // Add file content and newline
        });

        return result.trim(); // Remove last newline and return
    } catch (error) {
        console.error('_Error reading or concatenating files:', error);
        return null;
    }
}








