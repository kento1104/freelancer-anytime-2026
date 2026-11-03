// verificationCode.js

/**
 * Function to extract Verification Code from a string
 * @param {string} input - String containing the Verification Code
 * @returns {string} - Extracted Verification Code (e.g., "136411", "1234", "987654321")
 */
export default function extractVerificationCode(input) {
  // Use regular expression to extract numeric Verification Code
  const codeMatch = input.match(/\b\d+\b/); // Find numeric codes of any length
  if (codeMatch) {
    return codeMatch[0]; // Return matched code
  }
  throw new Error("_Verification code not found in the input string.");
}