// Use your Supabase Project URL and Publishable key here.
// Safe to expose the publishable/anon key in browser code when Row Level Security is configured.
// NEVER put a secret key or service_role key in this file.
const SUPABASE_URL = "https://bcvqxesqhrcmdecmbvuv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zQwt7sdy_P9UZnfsnfQu_A_Ube5Fmdr";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
