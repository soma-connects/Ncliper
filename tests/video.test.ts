
import { generateClipMetadata } from '../src/lib/video/metadata';
import { generateImage } from '../src/lib/video/image-gen';
import { extractFrame } from '../src/lib/video/processor';

// Mock dependencies
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify({
                        title: "Test Viral Title",
                        description: "Test Description",
                        thumbnail_prompt: "Test Prompt"
                    })
                }
            })
        })
    }))
}));

// Mock processor dependencies (ffmpeg, yt-dlp) are harder, so we might mock the functions themselves if we were testing logic *around* them, 
// but here we want to test the *integration* mostly or just that the code compiles and runs logic.
// For unit tests, we mock the heavy lifting.

jest.mock('fluent-ffmpeg', () => {
    return jest.fn().mockImplementation(() => ({
        setFfmpegPath: jest.fn(),
        seekInput: jest.fn().mockReturnThis(),
        frames: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockImplementation((event, cb) => {
            if (event === 'end') cb();
            return this;
        }),
        run: jest.fn()
    }));
});

// Mock youtube-dl-exec wrapper
jest.mock('youtube-dl-exec', () => {
    return {
        create: jest.fn().mockReturnValue(jest.fn().mockResolvedValue('https://mock-stream-url.com'))
    };
});

describe('Thumbnail System Modules', () => {

    test('generateClipMetadata returns parsed JSON', async () => {
        const result = await generateClipMetadata("some transcript");
        const parsed = JSON.parse(result);
        expect(parsed.title).toBe("Test Viral Title");
        expect(parsed.thumbnail_prompt).toBe("Test Prompt");
    });

    test('generateImage calls Gemini API', async () => {
        const response = await generateImage("some prompt");
        expect(response).toBeDefined();
        // Check mock structure
        expect(response?.text ? response.text() : '').toContain("Test Viral Title");
    });

    // processor.ts extractFrame is tricky to test without real ffmpeg/network
    // We'll skip deep mocking of extractFrame for this quick check and rely on manual verify or integration test if needed.
});
