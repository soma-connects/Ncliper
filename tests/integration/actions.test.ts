
import { getVideoTitle } from '@/lib/video/actions';

// Mock dependencies if needed, but for integration we might want some real logic
// However, YTDlpwrap requires binaries. We'll mock it for CI stability unless we are sure about env.
// For this test, we'll test the logic structure.

jest.mock('youtube-dl-exec', () => {
    return {
        create: () => jest.fn().mockImplementation(async (url) => {
            if (url.includes('fail')) throw new Error('Failed');
            return {
                title: 'Test Video Title',
                duration: 100
            };
        })
    };
});

describe('Video Actions Integration', () => {
    it('should fetch video title successfully', async () => {
        const result = await getVideoTitle('https://www.youtube.com/watch?v=good');
        expect(result).toHaveProperty('title', 'Test Video Title');
        expect(result).not.toHaveProperty('error');
    });

    it('should handle errors gracefully', async () => {
        const result = await getVideoTitle('https://www.youtube.com/watch?v=fail');
        expect(result).toHaveProperty('error');
    });

    it('should validate inputs', async () => {
        const result = await getVideoTitle('');
        expect(result).toHaveProperty('error', 'URL is required');
    });
});
