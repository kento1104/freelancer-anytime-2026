import fs from 'fs';
import path from 'path';

export default function convertStringValuesRecursive(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
  
        // If the value is an object, call recursively
        if (typeof value === 'object' && value !== null) {
          convertStringValuesRecursive(value);
        }
        // If the value is a string, process it
        else if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') {
            obj[key] = true;
          } else if (value.toLowerCase() === 'false') {
            obj[key] = false;
          } else if (!isNaN(value) && value.trim() !== '') {
            obj[key] = Number(value);
          }
        }
      }
    }
    return obj;
  }
