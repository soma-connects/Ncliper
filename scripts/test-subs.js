const YTDlpWrap = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

async function testSubs() {
    const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
    console.log(`Using yt-dlp: ${ytDlpPath}`);

    const yt = YTDlpWrap.create(ytDlpPath);
    const videoUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - short, has subs? Or use a popular one.
    // "Me at the zoo" might currently not have auto-subs in many langs. Let's use a popular tech video or the user's previous example if known.
    // Let's use a reliable one. 'https://www.youtube.com/watch?v=M7FIvfx5J10' (HTML5 video).

    try {
        console.log("Fetching subtitles...");
        const output = await yt(videoUrl, {
            skipDownload: true,
            writeAutoSub: true,
            writeSub: true,
            subLang: 'en',
            output: 'test_subs',
            printJson: true // We want metadata to see if it lists subs, but actual subs are written to file usually with these flags.
            // To get JSON dump of subs directly is tricky with wrapper.
            // Standard `yt-dlp --dump-json` gives metadata.
            // To get subs content, we usually need to read the file it writes or use `--dump-single-json` which might include them?
            // Actually, safest is `dumpSingleJson: true` and check `automatic_captions` or `subtitles` fields, 
            // BUT those fields usually contain URLs to the caption files, not the text itself.
            // So we likely need to download the caption content from that URL.
        });

        const info = output;
        console.log("Title:", info.title);

        let subUrl = null;
        if (info.subtitles && info.subtitles.en) {
            console.log("Found Manual English Subs");
            subUrl = info.subtitles.en.find(s => s.ext === 'json3')?.url;
        } else if (info.automatic_captions && info.automatic_captions.en) {
            console.log("Found Auto English Subs");
            // Prefer json3 if available for standard format
            subUrl = info.automatic_captions.en.find(s => s.ext === 'json3')?.url;
        }

        if (subUrl) {
            console.log(`Subtitle URL: ${subUrl}`);
            // In a real app we'd fetch this URL.
        } else {
            console.log("No subtitles found.");
        }

    } catch (e) {
        console.error(e);
    }
}

testSubs();
