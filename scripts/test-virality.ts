

// Static imports removed to allow dynamic loading after env vars
import fs from 'fs';
import path from 'path';

// Manually load .env.local
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log("Loaded .env.local");
        console.log("API Key present:", !!process.env.GOOGLE_API_KEY);
        if (process.env.GOOGLE_API_KEY) {
            console.log("API Key length:", process.env.GOOGLE_API_KEY.length);
        }
    }
} catch (e) {
    console.warn("Failed to load .env.local", e);
}


// Mock long transcript
const MOCK_TRANSCRIPT = `
Hey guys, welcome back to the channel! Today I'm going to show you how I almost died while climbing Mount Everest. It was a cold morning, -30 degrees. We started the ascent at 4 AM.
(5 minutes of hiking details)
...
Suddenly, the ice beneath me cracked. I heard a loud boom.
(2 minutes of silence and wind)
I looked down and saw a bottomless crevasse. My rope was the only thing saving me.
but then, the rope started to fray...
...
(10 minutes of backstory about childhood)
...
Back on the mountain, I swung my axe and caught the edge. I pulled myself up, gasping for air.
The Sherpa looked at me and said "You are lucky to be alive".
That moment changed my life forever.
In this video, I'll explain the physics of ice climbing and why you need safety gear.
`;

async function testViralityEngine() {
    console.log("=== Testing Virality Engine ===");

    // Dynamic imports to ensure env vars are loaded first
    const { analyzeTranscript } = await import('@/lib/video/virality');
    const { generateClipMetadata } = await import('@/lib/video/metadata');
    const { generateImage } = await import('@/lib/video/image-gen');

    // 1. Test Transcript Analysis
    console.log("\n1. Testing analyzeTranscript...");
    try {
        const hooksJson = await analyzeTranscript(MOCK_TRANSCRIPT);
        console.log("Hooks Result:", hooksJson);
        const hooks = JSON.parse(hooksJson);
        if (Array.isArray(hooks) && hooks.length > 0) {
            console.log("✅ Hooks generated successfully.");
            console.log("First Hook Score:", hooks[0].virality_score);
            console.log("First Hook Segments:", hooks[0].segments);
        } else {
            console.error("❌ Failed to generate proper hooks.");
        }
    } catch (e) {
        console.error("❌ Error in analyzeTranscript:", e);
    }

    // 2. Test Metadata Generation
    console.log("\n2. Testing generateClipMetadata...");
    try {
        const metadataJson = await generateClipMetadata(MOCK_TRANSCRIPT);
        console.log("Metadata Result:", metadataJson);
        const metadata = JSON.parse(metadataJson);
        if (metadata.title && metadata.thumbnail_prompt) {
            console.log("✅ Metadata generated successfully.");
            console.log("Title:", metadata.title);
            console.log("Thumbnail Prompt:", metadata.thumbnail_prompt);

            // 3. Test Image Generation (using the prompt from metadata)
            console.log("\n3. Testing generateImage...");
            try {
                const imageBase64 = await generateImage(metadata.thumbnail_prompt);
                if (imageBase64 && imageBase64.startsWith('data:image/')) {
                    console.log("✅ Image generated successfully (Base64 received).");
                    console.log("Image Data Length:", imageBase64.length);
                } else {
                    console.error("❌ Failed to generate image or invalid format.");
                    console.log("Received:", imageBase64 ? imageBase64.slice(0, 100) : "null");
                }
            } catch (e) {
                console.error("❌ Error in generateImage:", e);
            }

        } else {
            console.error("❌ Metadata missing title or thumbnail_prompt.");
        }
    } catch (e) {
        console.error("❌ Error in generateClipMetadata:", e);
    }
}

testViralityEngine();
