const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://glwcjaqyatkyqvnrkqty.supabase.co';
const supabaseKey = 'sb_publishable_pPU2g4awOkYHByh46ntRQA_Cj8zqXnw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
            if (error.code === 'PGRST301') {
                console.log('NOTE: Auth error is expected if RLS is on. Connection reached server.');
            }
        } else {
            console.log('Connection successful! Table access verified.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkConnection();
