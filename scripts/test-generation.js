
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

const genAI = new GoogleGenerativeAI(API_KEY);

const modelName = "gemini-3-flash-preview";

async function test() {
    console.log(`Testing generation with model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:");
        console.log(text);
    } catch (error) {
        console.error("Error during generation:", error);
    }
}

test();
