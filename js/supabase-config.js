// Supabase connection — fill these in from your project's Settings → API page.
// SUPABASE_ANON_KEY is the public "anon" key — it is SAFE to expose in client-side
// code like this (that's what it's for). Never put the "service_role" key here.
const SUPABASE_URL = "https://gdovffnqnctthmyfrnye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb3ZmZm5xbmN0dGhteWZybnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDY1NzAsImV4cCI6MjEwMDUyMjU3MH0.jEke1EqO_knC30T-5e4mUaq6CajGnI2aNOF7CDQDc4Q";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
