import { translate } from 'google-translate-api-x';

// Proxy list
const proxies = [
    'http://47.74.226.8:5001',
    'http://47.251.43.115:33333',
    'http://188.166.56.246:80',
    'http://13.80.134.180:80',
    'http://101.71.143.237:8092',
    'http://101.66.199.247:8085',
    'http://154.65.39.8:80',
    'http://38.54.71.67:80',
    'http://162.223.90.130:80',
    'http://212.127.95.235:8081',
    'http://4.149.210.210:3128',
    'http://103.127.38.46:7070',
];

// User-Agent list
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
];

const translateText = async (text, targetLanguage) => {
    try {
        // Replace line breaks with placeholders for translation
        const textWithPlaceholder = text.replace(/\n/g, ' ___ ');

        // Select random proxy and User-Agent
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        // Translation request
        const res = await translate(textWithPlaceholder, {
            to: targetLanguage, // Set target language
            proxy: proxy, // Use proxy
            headers: {
                'User-Agent': userAgent, // Rotate User-Agent
            },
        });

        // Restore placeholders to actual line breaks after translation
        let translatedText = res.text.replace(/ ___ /g, '\n');
        translatedText = translatedText.replace(/___ /g, '\n');
        translatedText = translatedText.replace(/ ___/g, '\n');
        translatedText = translatedText.replace(/___/g, '\n');

        // Return translated text
        return translatedText;
    } catch (error) {
        console.error('_Error occurred during translation:', error);
        return text;
    }
};
export default translateText;

// Usage example
// translateText('Hello, world!')
//    .then(translated => console.log(translated))
//    .catch(err => console.error(err));