import axios from 'axios';

export default async () => {
    try {
        // Get current IP address
        const { data: ipData } = await axios.get('https://api64.ipify.org?format=json');
        const ip = ipData.ip;

        // Check country information (default: use ip-api)
        const { data: geoData } = await axios.get(`http://ip-api.com/json/${ip}?fields=country`);
        // const { data: geoData } = await axios.get(`https://ipwho.is/${ip}`);
        // const { data: geoData } = await axios.get(`https://api.myip.com/`);
        return { ip, country: geoData.country };
    } catch (error) {
        console.error('_Error:', error);
        return null;
    }
};