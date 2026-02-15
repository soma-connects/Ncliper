
import { downloadVideoLocally, uploadToR2 } from '../src/lib/video-downloader.ts';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load Supabase/Clerk keys
dotenv.config({ path: '.env' });       // Load R2 keys

async function test() {
    const videoUrl = "https://www.youtube.com/watch?v=DbhQiwfw5Xw";
    const jobId = "test-hybrid-" + Date.now();

    console.log("Testing Download...");
    const filePath = await downloadVideoLocally(videoUrl, jobId);
    console.log("Downloaded to:", filePath);

    console.log("Testing Upload...");
    const r2Key = `test/${jobId}.mp4`;
    const url = await uploadToR2(filePath, r2Key);
    console.log("Uploaded to:", url);

    // Cleanup
    // const fs = require('fs');
    // fs.unlinkSync(filePath);
}

test().catch(console.error);
