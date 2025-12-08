// libs/supabaseClient.js
// Inicializa Supabase (supabase-js v2) y expone helpers para procesar tokens desde la URL.

const SUPABASE_URL = "https://wchebsodfqocnsbytjsq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGVic29kZnFvY25zYnl0anNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjA2NjIsImV4cCI6MjA3OTMzNjY2Mn0.V89Jveh0TqB9k99JRtxdgrhKXuZpAzuU4khC_gZWrbg";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en libs/supabaseClient.js");
}

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
 Helper: procesa tokens que vienen en la URL (hash o query) y establece la sesión usando
 supabase.auth.setSession cuando esté disponible. Devuelve { success: boolean, reason?: string }.
*/
async function setSessionFromUrl() {
  try {
    const raw = window.location.hash?.slice(1) || window.location.search?.slice(1) || "";
    if (!raw) return { success: false, reason: "no_tokens" };

    const params = new URLSearchParams(raw);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const error = params.get("error");
    const error_description = params.get("error_description");

    if (error) return { success: false, reason: "error_in_url", message: error_description || error };
    if (!access_token) return { success: false, reason: "no_access_token" };

    if (window.supabase?.auth?.setSession) {
      const res = await window.supabase.auth.setSession({ access_token, refresh_token });
      if (res?.error) return { success: false, reason: "setSession_failed", message: res.error.message || res.error };
      // Limpia la parte de hash/query para evitar reprocesos
      try { history.replaceState(null, "", window.location.pathname); } catch (e) { /* ignore */ }
      return { success: true };
    }

    // Fallback: guardar token en localStorage con formato que algunas apps consumen
    localStorage.setItem(
      "supabase.auth.token",
      JSON.stringify({
        access_token,
        refresh_token,
        expires_at: Date.now() + (parseInt(params.get("expires_in") || "0", 10) * 1000),
      })
    );
    return { success: true, fallback: true };
  } catch (err) {
    return { success: false, reason: "exception", message: err?.message || String(err) };
  }
}

/*
 Utility para calcular redirectTo correcto: devuelve origin + ruta por defecto.
 Se usa para enviar en reset/resend/signUp para que Supabase genere enlaces con el puerto correcto.
*/
function defaultRedirectTo(path = "/email-confirmation.html") {
  return window.location.origin.replace(/\/$/, "") + path;
}

// Exponer helpers globalmente para que el resto de la app los use
window.supabaseHelpers = {
  setSessionFromUrl,
  defaultRedirectTo,
};

// Comprobación opcional al cargar para depuración
(async () => {
  try {
    const { data } = await window.supabase.auth.getSession();
    console.debug("Supabase inicializado. Sesión actual:", data);
  } catch (err) {
    console.error("Error comprobando sesión Supabase:", err);
  }
})();