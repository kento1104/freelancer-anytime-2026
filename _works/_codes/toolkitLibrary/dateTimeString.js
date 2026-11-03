// getDateTimeString.js


// Function to generate a file name based on UTC or local time
function getDateTimeString(isUTC=true) {
  // Get the current date object
  const currentDate = new Date();
  
  // Choose the date based on whether UTC or local time is required
  const dateToUse = isUTC ? currentDate.toISOString() : currentDate.toLocaleString();
  
  // Replace ':' with '-', change 'T' to '_', remove milliseconds, and add '_UTC' or '_LOCAL' suffix
  const formattedDate = dateToUse
    .replace(/:/g, '-')  // Replace ':' with '-'
    .replace('T', '_')    // Replace 'T' with '_'
    .replace(/\..+/, '')  // Remove milliseconds
    + (isUTC ? '_UTC' : '_LOCAL');  // Add '_UTC' or '_LOCAL' suffix depending on the time zone
  
  return formattedDate;
}




//// Example usage
//const utcFileName = getDateTimeString(true);  // Generate UTC based file name
//const localFileName = getDateTimeString(false);  // Generate local based file name
//
//console.log("UTC File Name:", utcFileName);  // Example: 2025-02-26_10-30-15_UTC
//console.log("Local File Name:", localFileName);  // Example: 2025-02-26_10-30-15_LOCAL




function parseTimestamp(timestamp) {
  const [date, time, type] = timestamp.split('_');
  const [year, month, day] = date.split('-');
  const [hour, minute, second] = time.split('-');

  const formattedDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  if (type === 'UTC') {
    // For UTC time, we directly parse it as UTC
    return new Date(formattedDate + 'Z'); // Adding 'Z' to indicate UTC
  } else if (type === 'LOCAL') {
    // For local time, create the Date object based on the local timezone
    return new Date(formattedDate);
  }

  throw new Error('_Invalid timestamp type');
}
//console.log(parseTimestamp('2025-02-26_10-30-15_UTC')); // UTC time
//console.log(parseTimestamp('2025-02-26_10-30-15_LOCAL')); // Local time

export {getDateTimeString, parseTimestamp}; 
