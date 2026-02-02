const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const YTDlpWrap = require('youtube-dl-exec');

// Setup Paths
const ffmpegPath = path.join(process.cwd(), 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);

const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');
if (!fs.existsSync(CLIPS_DIR)) {
    fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

async function runTest() {
    // The exact video user was trying: "Wait did you see that glitch? That was intentional."
    // Likely a Short or Landscape video?
    // User logs show failure on -tnNEamXLuY
    const videoUrl = 'https://www.youtube.com/watch?v=-tnNEamXLuY';

    const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
    const yt = YTDlpWrap.create(ytDlpPath);

    console.log("1. Fetching Stream URL...");
    try {
        const streamUrlOutput = await yt(videoUrl, {
            getUrl: true,
            format: '22/18/best',
            noWarnings: true,
        });
        const streamUrl = streamUrlOutput.toString().trim();
        console.log("Stream URL:", streamUrl);

        const outputPath = path.join(CLIPS_DIR, `repro_${Date.now()}.mp4`);

        // Exact filter from processor.ts
        // const filters = ['crop=ih*(9/16):ih:iw/2-(ih*(9/16))/2:0'];

        // Hypothesis: Width (ih*9/16) might be odd. 
        // For video height 720: 720 * 9/16 = 405. 
        // 405 is odd. Regular h264 requires even dimensions (divisible by 2).

        console.log("2. Running FFmpeg...");

        ffmpeg(streamUrl)
            .setStartTime(0)
            .setDuration(5)
            .videoFilters([
                'crop=ih*(9/16):ih:iw/2-(ih*(9/16))/2:0',
                "drawtext=text='Test':fontfile='arial.ttf':fontsize=24:x=10:y=10"
            ])
            .on('start', (cmd) => {
                // Copy font locally for test
                if (!fs.existsSync('arial.ttf')) {
                    try {
                        fs.copyFileSync('C:\\Windows\\Fonts\\arial.ttf', 'arial.ttf');
                    } catch (e) { console.error("Could not copy font:", e); }
                }
                console.log("FFmpeg Command:", cmd);
            })
            .on('end', () => {
                console.log("Success! File created at", outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error("FFmpeg Error:", err.message);
                console.error("Stderr:", stderr);
            })
            .save(outputPath);

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTest();
