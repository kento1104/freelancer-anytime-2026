import generateRandomBirthDay from './generateRandomBirthDay.js';



export default (name, birthDay) => {
    let year, month, day;

    if (birthDay instanceof Date) {
        year = birthDay.getFullYear();
        month = String(birthDay.getMonth() + 1).padStart(2, '0');
        day = String(birthDay.getDate()).padStart(2, '0');
    } else {
        const randomBirthDay = generateRandomBirthDay();
        year = randomBirthDay.getFullYear();
        month = String(randomBirthDay.getMonth() + 1).padStart(2, '0');
        day = String(randomBirthDay.getDate()).padStart(2, '0');
    }

    const randomSeparator = ['_', '.', '', '-'][Math.floor(Math.random() * 4)];
    const randomFormat = [
        `${name}${year}${randomSeparator}${month}${randomSeparator}${day}`,
        `${name}${year}${randomSeparator}${month}`,
        `${name}${month}${randomSeparator}${day}${randomSeparator}${year}`,
        `${name}${day}${randomSeparator}${month}${randomSeparator}${year}`
    ];

    return randomFormat[Math.floor(Math.random() * randomFormat.length)];
};