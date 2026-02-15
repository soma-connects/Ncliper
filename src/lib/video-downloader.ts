import path from 'path';
import fs from 'fs';
import os from 'os';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { spawn } from 'child_process';

// Configure R2 Client
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ncliper-clips';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function downloadVideoLocally(url: string, jobId: string): Promise<string> {
    const tempDir = path.join(process.env.TEMP || os.tmpdir(), 'ncliper-downloads');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `${jobId}.mp4`);

    // Clean up existing file
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Locate yt-dlp binary
    const binaryPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
    console.log(`[LocalDownloader] Spawning yt-dlp: ${binaryPath}`);

    return new Promise((resolve, reject) => {
        const args = [
            url,
            '-o', filePath,
            '-f', 'best[ext=mp4]/best',
            '--no-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--referer', 'https://www.youtube.com/',
            '--add-header', 'Accept-Language:en-US,en;q=0.9'
        ];

        const process = spawn(binaryPath, args);

        process.stdout.on('data', (data) => console.log(`[yt-dlp] ${data}`));
        process.stderr.on('data', (data) => console.error(`[yt-dlp error] ${data}`));

        process.on('close', (code) => {
            if (code === 0 && fs.existsSync(filePath)) {
                resolve(filePath);
            } else {
                reject(new Error(`yt-dlp exited with code ${code}`));
            }
        });

        process.on('error', (err) => {
            reject(new Error(`Failed to start yt-dlp: ${err.message}`));
        });
    });
}

export async function uploadToR2(filePath: string, key: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const bucketName = R2_BUCKET_NAME;
    const publicUrlBase = R2_PUBLIC_URL || '';

    console.log(`[LocalUploader] Uploading ${filePath} to R2 bucket ${bucketName} as ${key}...`);

    try {
        const upload = new Upload({
            client: r2,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: fileStream,
                ContentType: 'video/mp4',
            },
        });

        await upload.done();
        console.log(`[LocalUploader] Upload complete`);

        // Construct public URL
        // If publicUrlBase ends with slash, remove it.
        const baseUrl = publicUrlBase.replace(/\/$/, '');
        const url = `${baseUrl}/${key}`;
        return url;

    } catch (error) {
        console.error(`[LocalUploader] Error uploading to R2:`, error);
        throw error;
    }
}
