export default function parseString(input) {
  // If the input starts with '!', remove it
  if (input.startsWith('!')) {
    input = input.slice(1);
  }

  // Remove all leading special characters
  while (/[^a-zA-Z0-9]/.test(input[0])) {
    input = input.slice(1);
  }

  // Ensure the first character is no longer a special character
  if (!input || /[^a-zA-Z0-9]/.test(input[0])) {
    throw new Error("The first character must be a non-special character.");
  }

  // Split the remaining string by '#'
  const resultArray = input.split('#');

  return resultArray;
}

  
//  console.log(parseString('!@hello#world#example')); // ["hello", "world", "example"]
//  console.log(parseString('#@special#case#test'));   // ["special", "case", "test"]