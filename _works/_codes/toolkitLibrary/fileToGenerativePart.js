import fs from "fs";
import mime from "mime-types";
import path from "path";

function fileToGenerativePart(filePath) {
  try {
    // Normalize path and handle long paths
    const normalizedPath = path.normalize(filePath);
    const longPath = '\\\\?\\' + normalizedPath; // Handle long paths

    // Convert file to Base64 and return
    const data = Buffer.from(fs.readFileSync(longPath)).toString("base64");

    return {
      inlineData: {
        data: data,
        mimeType: mime.lookup(filePath) || "application/octet-stream",
      },
    };
  } catch (error) {
    console.error("_Error reading file:", error);
    return null;  // Return null on error (can handle differently if needed)
  }
}

export default fileToGenerativePart;
