import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim().replace(/^"/, '').replace(/"$/, '');
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

async function run() {
    const jobId = '5ba807d5-ce9e-4673-ab4b-ebae2adec686';

    // 1. Get Job
    const jobRes = await fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${jobId}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const jobs = await jobRes.json();
    console.log('--- JOB ---');
    console.log(JSON.stringify(jobs, null, 2));

    if (jobs.length > 0) {
        const projectId = jobs[0].settings?.project_id;
        console.log('\n--- PROJECT ID:', projectId, '---');

        if (projectId) {
            // 2. Get Project
            const projRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            console.log(JSON.stringify(await projRes.json(), null, 2));

            // 3. Get Clips
            const clipsRes = await fetch(`${supabaseUrl}/rest/v1/clips?project_id=eq.${projectId}&select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            console.log('\n--- CLIPS ---');
            console.log(JSON.stringify(await clipsRes.json(), null, 2));
        }
    }
}
run();
