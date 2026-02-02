const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(path.join(process.cwd(), 'ffmpeg.exe'));

const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');
if (!fs.existsSync(CLIPS_DIR)) {
    fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

function testFfmpeg(filterString, attemptName) {
    const outputPath = path.join(CLIPS_DIR, `test_${attemptName}.mp4`);
    console.log(`[${attemptName}] Testing filter: ${filterString}`);
    console.log(`[${attemptName}] Output: ${outputPath}`);

    ffmpeg('testsrc=size=1280x720:rate=30')
        .inputFormat('lavfi')
        .duration(3)
        .videoFilters(filterString)
        .output(outputPath)
        .on('end', () => console.log(`[${attemptName}] Success!`))
        .on('error', (err) => console.error(`[${attemptName}] Failed:`, err.message))
        .run();
}

// 1. Current Implementation
const winPath = 'C:\\Windows\\Fonts\\arial.ttf';
const currentImpl = winPath.replace(/\\/g, '/').replace(/:/g, '\\:');
const filter1 = `drawtext=text='Test1':fontfile='${currentImpl}':fontsize=24:x=100:y=100`;
testFfmpeg(filter1, 'current_impl');

// 2. Simple Forward Slashes
const simpleForward = winPath.replace(/\\/g, '/');
const filter2 = `drawtext=text='Test2':fontfile='${simpleForward}':fontsize=24:x=100:y=100`;
testFfmpeg(filter2, 'simple_forward');

// 3. Double Escaped Backslashes
const doubleBack = winPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
const filter3 = `drawtext=text='Test3':fontfile='${doubleBack}':fontsize=24:x=100:y=100`;
testFfmpeg(filter3, 'double_back');
