/* =========================================================
   FANTASMAS — CONEXÃO SUPABASE (GLOBAL)
========================================================= */

const SUPABASE_URL = 'https://jwwlcbimfigxdvmlbpwm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HmLWfiMFdU_r_MOvtfwwOQ_r5KmaQRa';

// Usa o SDK carregado na tag <script> do HTML para criar o cliente global
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("🟢 Supabase conectado com sucesso ao sistema!");
} else {
    console.error("🔴 Erro: A biblioteca do Supabase não foi carregada no HTML.");
}