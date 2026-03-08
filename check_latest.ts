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
    const projRes = await fetch(`${supabaseUrl}/rest/v1/projects?select=id,title,video_url,created_at&order=created_at.desc&limit=5`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const projects = await projRes.json();
    console.log('--- RECENT PROJECTS ---');
    console.log(JSON.stringify(projects, null, 2));

    if (projects.length > 0) {
        const jobRes = await fetch(`${supabaseUrl}/rest/v1/jobs?select=id,status,result_data&video_url=eq.${projects[0].video_url}&order=created_at.desc&limit=1`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        console.log('--- LATEST JOB ---');
        console.log(JSON.stringify(await jobRes.json(), null, 2));

        const clipsRes = await fetch(`${supabaseUrl}/rest/v1/clips?project_id=eq.${projects[0].id}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        console.log('--- CLIPS FOR LATEST PROJECT ---');
        console.log(JSON.stringify(await clipsRes.json(), null, 2));
    }
}
run();
