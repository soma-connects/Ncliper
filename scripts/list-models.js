
const https = require('https');

const fs = require('fs');
const path = require('path');

let API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY && fs.existsSync(path.join(__dirname, '../.env.local'))) {
    const envConfig = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
    const match = envConfig.match(/GOOGLE_API_KEY=(.*)/);
    if (match) {
        API_KEY = match[1].trim();
    }
}

if (!API_KEY) {
    console.error("GOOGLE_API_KEY not set");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
            return;
        }
        try {
            const models = JSON.parse(data);
            console.log("Available Models:");
            models.models.forEach(m => {
                if (m.name.includes('flash') || m.name.includes('lite')) {
                    console.log(`- ${m.name}`);
                }
            });
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
