const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    let apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        try {
            const envPath = path.join(__dirname, '..', '.env.local');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
            if (match) {
                apiKey = match[1].trim();
            }
        } catch (e) {
            console.warn("Could not read .env.local", e);
        }
    }

    if (!apiKey) {
        console.error("GOOGLE_API_KEY not found in env or .env.local");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching available models...");
        // Assuming there isn't a direct listModels method exposed on the helpers in older SDK ver,
        // but let's check if the SDK supports it.
        // Actually, looking at docs, it's usually via API. 
        // The node SDK might not export listModels directly in the main class.
        // Let's try to infer or use the genAI instance if possible.
        // Wait, the SDK doesn't always have listModels on the main client.
        // It might be better to just curl.

        // Alternative: Use fetch directly to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
