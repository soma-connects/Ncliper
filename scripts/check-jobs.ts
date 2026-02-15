
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, status, error, created_at, settings')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    console.log("Recent Jobs:");
    jobs.forEach(job => {
        console.log(`[${job.created_at}] ${job.id}: ${job.status} ${job.error ? `(Error: ${job.error})` : ''}`);
        if (job.settings?.download_url) {
            console.log(`   - used download_url: ${job.settings.download_url}`);
        }
    });
}

check();
