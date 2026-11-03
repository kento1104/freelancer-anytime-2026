export default function stringToObject(str) {
  try {
    const openBraceIndex = str.indexOf('{');
    const closeBraceIndex = str.lastIndexOf('}');

    if (openBraceIndex === -1 || closeBraceIndex === -1 || openBraceIndex >= closeBraceIndex) {
      return "_Invalid input string. '{' and '}' must be in the correct positions.";
    }

    const jsonString = str.substring(openBraceIndex, closeBraceIndex + 1);
    const obj = JSON.parse(jsonString);
    return obj;
  } catch (e) {
      if (e instanceof SyntaxError){
          return "_JSON parsing error: " + e.message;
      } else {
          return "_Error occurred: " + e.message;
      }
  }
}

// Test cases
// console.log(stringToObject("abc{ \"name\": \"John\", \"age\": 30 }xyz")); // Output: { name: 'John', age: 30 }
// console.log(stringToObject("{ \"name\": \"John\", \"age\": 30 }")); // Output: { name: 'John', age: 30 }
// console.log(stringToObject("abc{ \"name\": \"John\" }xyz{ \"age\": 30 }"));// Output: { name: 'John' } 
// console.log(stringToObject("abc{invalid json}xyz")); // Output: JSON parsing error ...
// console.log(stringToObject("abc}xyz{")); // Output: Invalid input string.
// console.log(stringToObject("abcxyz")); // Output: Invalid input string.


// "{ \"name\": \"John\", \"age\": 30, \"city\": \"New York\" }"
// "{ \"name\": \"John\", \"age\": 30, \"city\": [\"New York\", \"Seoul\"] }"