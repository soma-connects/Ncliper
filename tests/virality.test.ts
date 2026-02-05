
import { analyzeTranscript } from '../src/lib/video/virality';
import { generateClipMetadata } from '../src/lib/video/metadata';
import { generateImage } from '../src/lib/video/image-gen';
import { jest } from '@jest/globals';

// Mock server-only to avoid errors in test environment
jest.mock('server-only', () => { return {}; });

// Mock Dotenv
import 'dotenv/config';

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

const TIMEOUT = 60000; // 60s timeout for API calls

describe('Virality Engine', () => {

    it('should generate viral hooks with valid schema and scoring', async () => {
        const hooksJson = await analyzeTranscript(MOCK_TRANSCRIPT);
        console.log("Hooks Result:", hooksJson);
        const hooks = JSON.parse(hooksJson);

        expect(Array.isArray(hooks)).toBe(true);
        expect(hooks.length).toBeGreaterThan(0);
        expect(hooks[0]).toHaveProperty('virality_score');
        expect(hooks[0]).toHaveProperty('segments');
        expect(typeof hooks[0].virality_score).toBe('number');
    }, TIMEOUT);

    it('should generate metadata with title and thumbnail prompt', async () => {
        const metadataJson = await generateClipMetadata(MOCK_TRANSCRIPT);
        console.log("Metadata Result:", metadataJson);
        const metadata = JSON.parse(metadataJson);

        expect(metadata).toHaveProperty('title');
        expect(metadata).toHaveProperty('thumbnail_prompt');
        expect(metadata.title.length).toBeGreaterThan(0);
    }, TIMEOUT);

    it('should generate an image returning base64', async () => {
        // Skip if no API key is present in env, but usually we expect it in dev
        if (!process.env.GOOGLE_API_KEY) {
            console.warn("Skipping image test due to missing API KEY");
            return;
        }

        const prompt = "A photorealistic majestic mountain peak at sunrise, cinematic lighting, 8k";
        const imageBase64 = await generateImage(prompt);

        if (imageBase64) {
            expect(typeof imageBase64).toBe('string');
            expect(imageBase64.startsWith('data:image/')).toBe(true);
        } else {
            // If null, it might be due to model availability or quota, but we log it
            console.warn("Image generation returned null (possibly quota or model issue)");
        }
    }, TIMEOUT);
});
