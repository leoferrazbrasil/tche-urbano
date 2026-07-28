/* ==========================================================================
   Tchê Urbano - Supabase Backend Connection Client
   ========================================================================== */

const SUPABASE_URL = "https://ycpzyuzkainfglljfmbn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oodZFeDSVA-Q2wXfa8ZAzQ_O20oTUl0";

// Global Supabase Client
let _supabase = null;

function getSupabaseClient() {
    if (!_supabase) {
        if (typeof supabase !== "undefined" && supabase.createClient) {
            _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.warn("Supabase SDK CDN is loading or unavailable.");
        }
    }
    return _supabase;
}
