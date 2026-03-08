import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url) throw new Error('SUPABASE URL not configured');
if (!anonKey) throw new Error('SUPABASE ANON KEY not configured');
if (!serviceRoleKey) throw new Error('SUPABASE SERVICE ROLE KEY not configured');

// regular client for browser
export const supabase = createClient(url, anonKey);
// server-side with elevated privileges
export const supabaseAdmin = createClient(url, serviceRoleKey);
