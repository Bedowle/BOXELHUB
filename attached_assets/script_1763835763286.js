// script.js
// Lógica de la app y autenticación con Supabase (limpio y listo para copiar/pegar)

let projects = [];
let currentUser = null;

/* ---------- Inicialización ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  loadProjects();
  setupEventListeners();
  await tryRestoreSession();
  initAuthListener();
});

/* ---------- Proyectos (UI) ---------- */
function loadProjects() {
  projects = [
    { id: 1, name: "Prototipo de engranaje", description: "Engranaje mecánico para proyecto universitario", material: "PLA", status: "active", bids: 3, created: "2024-01-15" },
    { id: 2, name: "Estatuilla decorativa", description: "Figura decorativa para estantería", material: "PETG", status: "active", bids: 5, created: "2024-01-14" },
    { id: 3, name: "Soporte para teléfono", description: "Soporte ergonómico para escritorio", material: "ABS", status: "active", bids: 2, created: "2024-01-13" },
  ];
  renderProjects();
}

function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;
  grid.innerHTML = projects.map(project => `
    <div class="project-card bg-white rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <h3 class="text-xl font-semibold mb-2">${project.name}</h3>
        <p class="text-gray-600 mb-4">${project.description}</p>
        <div class="flex justify-between items-center mb-4">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${project.material}</span>
          <span class="text-gray-500 text-sm">${project.bids} ofertas</span>
        </div>
        <button onclick="viewProject(${project.id})" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300">Ver Detalles</button>
      </div>
    </div>
  `).join("");
}

/* ---------- Modales / Upload (simulado) ---------- */
function showUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex", "modal-enter");
}
function hideUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex", "modal-enter");
}
function handleFileUpload(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const newProject = {
    id: projects.length + 1,
    name: formData.get("projectName"),
    description: formData.get("description"),
    material: formData.get("material"),
    status: "active",
    bids: 0,
    created: new Date().toISOString().split("T")[0],
  };
  projects.unshift(newProject);
  renderProjects();
  hideUploadModal();
  e.target.reset();
  showNotification("¡Proyecto subido exitosamente! Los makers comenzarán a enviar ofertas pronto.", "success");
}

/* ---------- Navegación ---------- */
function viewProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (project) {
    showNotification(`Redirigiendo a detalles de: ${project.name}`, "info");
    window.location.href = `project.html?id=${projectId}`;
  }
}

/* ---------- Event Listeners globales (forms, botones) ---------- */
function setupEventListeners() {
  // Upload form
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) uploadForm.addEventListener("submit", handleFileUpload);

  // Login form (si existe en la página)
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      const email = fd.get("email");
      const password = fd.get("password");
      const result = await loginUser(email, password);
      if (result.success) {
        showNotification("Inicio de sesión exitoso", "success");
        setTimeout(() => { window.location.href = "index.html"; }, 800);
      } else {
        showNotification(result.message || "Error iniciando sesión", "error");
      }
    });
  }

  // Register form (si existe en la página)
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      // validación básica de contraseñas si están en el form
      const pwd = this.querySelector('input[name="password"]')?.value || "";
      const cpwd = this.querySelector('input[name="confirmPassword"]')?.value || "";
      if (pwd && cpwd && pwd !== cpwd) {
        showNotification("Las contraseñas no coinciden", "error");
        return;
      }
      const fd = new FormData(this);
      const userData = {
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        userType: fd.get("userType"),
      };
      const result = await registerUser(userData);
      if (result.success) {
        showNotification(result.message, "success");
        setTimeout(() => { window.location.href = "email-confirmation.html"; }, 900);
      } else {
        showNotification(result.message || "Error en registro", "error");
      }
    });
  }

  // Resend button in confirmation page (if present)
  const resendBtn = document.getElementById("resendBtn");
  if (resendBtn) {
    resendBtn.addEventListener("click", async function () {
      showNotification("Reenviando enlace...", "info");
      const res = await resendVerificationEmail();
      if (res.success) showNotification("Enlace reenviado a tu correo", "success");
      else showNotification(res.message || "Error reenviando", "error");
    });
  }
}

/* ---------- Autenticación (helpers) ---------- */
async function tryRestoreSession() {
  // primero intentar procesar tokens en la URL (magic link / reset)
  if (window.supabaseHelpers?.setSessionFromUrl) {
    const res = await window.supabaseHelpers.setSessionFromUrl();
    if (res.success) {
      await refreshLocalUserFromSupabase();
      return;
    }
  }
  // si no procesó token, verificar sesión activa
  await refreshLocalUserFromSupabase();
}

function initAuthListener() {
  if (!window.supabase?.auth?.onAuthStateChange) return;
  window.supabase.auth.onAuthStateChange(async () => {
    await refreshLocalUserFromSupabase();
  });
}

async function refreshLocalUserFromSupabase() {
  try {
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user ?? null;
    if (user) {
      currentUser = { email: user.email, name: user.user_metadata?.name || "", userType: user.user_metadata?.userType || "" };
      localStorage.setItem("voxelhub_currentUser", JSON.stringify(currentUser));
      updateNavbarForLoggedInUser();
    } else {
      currentUser = null;
      localStorage.removeItem("voxelhub_currentUser");
      updateNavbarForLoggedOutUser();
    }
  } catch (err) {
    console.error("Error obteniendo sesión:", err);
  }
}

/* ---------- Register / Login / Logout ---------- */
async function registerUser(userData) {
  try {
    const redirectTo = window.supabaseHelpers?.defaultRedirectTo("/email-confirmation.html") || (window.location.origin + "/email-confirmation.html");
    const { data, error } = await window.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name || "",
          userType: userData.userType || "client",
        },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) return { success: false, message: error.message };
    localStorage.setItem("voxelhub_lastPendingEmail", userData.email);
    return { success: true, message: "Registro exitoso. Revisa tu correo para confirmar tu email." };
  } catch (e) {
    return { success: false, message: e.message || "Error en registro" };
  }
}

async function loginUser(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    const user = data?.user;
    if (user) {
      currentUser = { email: user.email, name: user.user_metadata?.name || "", userType: user.user_metadata?.userType || "" };
      localStorage.setItem("voxelhub_currentUser", JSON.stringify(currentUser));
      updateNavbarForLoggedInUser();
      return { success: true, user: currentUser };
    }
    return { success: false, message: "No se obtuvo usuario tras login" };
  } catch (e) {
    return { success: false, message: e.message || "Error iniciando sesión" };
  }
}

// logoutUser: evita scope global y fuerza limpieza local
async function logoutUser() {
  try {
    console.debug("logoutUser: intentando signOut (no global)...");
    if (window.supabase?.auth?.signOut) {
      // llamar sin scope global para evitar 403 cuando no hay cookies
      const res = await window.supabase.auth.signOut({ global: false }).catch(err => err);
      console.debug("logoutUser: signOut result:", res);
      if (res && res.error) console.warn("logoutUser: signOut error:", res.error);
    } else {
      console.warn("logoutUser: window.supabase.auth.signOut no disponible");
    }
  } catch (err) {
    console.warn("logoutUser: signOut lanzó excepción:", err);
  }

  // limpieza local robusta
  try { currentUser = null; } catch(e){}
  try { localStorage.removeItem("voxelhub_currentUser"); } catch(e){}
  try { localStorage.removeItem("voxelhub_lastPendingEmail"); } catch(e){}
  try { localStorage.removeItem("supabase.auth.token"); } catch(e){}
  try { sessionStorage.clear(); } catch(e){}

  // borrar cookies (path=/)
  try {
    document.cookie.split(";").forEach(c => {
      const name = c.split("=")[0].trim();
      document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });
  } catch(e){}

  // actualizar UI
  try { updateNavbarForLoggedOutUser(); } catch(e) { try { location.reload(); } catch(e) {} }

  showNotification("Sesión cerrada correctamente", "info");
}

/* ---------- Resend / Verify helpers (email confirmation) ---------- */
async function resendVerificationEmail(email) {
  try {
    const target = email || localStorage.getItem("voxelhub_lastPendingEmail");
    if (!target) return { success: false, message: "No hay correo disponible para reenviar" };
    const redirectTo = window.supabaseHelpers?.defaultRedirectTo("/email-confirmation.html");
    if (window.supabase?.auth?.resend) {
      const r = await window.supabase.auth.resend({ type: "signup", email: target, options: { emailRedirectTo: redirectTo } });
      if (r?.error) return { success: false, message: r.error.message || "Error al reenviar" };
      return { success: true };
    }
    // fallback: trigger signup again (may or may not send)
    const r2 = await window.supabase.auth.signUp({ email: target, password: Math.random().toString(36).slice(-10), options: { emailRedirectTo: redirectTo } });
    if (r2?.error) return { success: false, message: r2.error.message || "Error al reenviar" };
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Error inesperado al reenviar" };
  }
}

/* ---------- UI: navbar updates ---------- */
function updateNavbarForLoggedInUser() {
  const navbarEl = document.querySelector(".custom-navbar");
  if (!navbarEl || !currentUser) return;
  const rightArea = navbarEl.querySelector(".flex.items-center.gap-3:last-child") || navbarEl.querySelector("div.flex.items-center.gap-3");
  if (!rightArea) return;
  rightArea.innerHTML = `
    <div class="flex items-center space-x-4">
      <span class="text-gray-700">Hola, ${currentUser.name || currentUser.email}</span>
      <button onclick="logoutUser()" class="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition">Cerrar Sesión</button>
    </div>
  `;
}

function updateNavbarForLoggedOutUser() {
  const navbarEl = document.querySelector(".custom-navbar");
  if (!navbarEl) return;
  const rightArea = navbarEl.querySelector(".flex.items-center.gap-3:last-child") || navbarEl.querySelector("div.flex.items-center.gap-3");
  if (!rightArea) return;
  rightArea.innerHTML = `
    <a href="maker-register.html" class="px-4 py-2 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition">Tengo una Impresora 3D</a>
    <a href="login.html" class="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">Registrarse/Iniciar Sesión</a>
  `;
}

/* ---------- Utilidades ---------- */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success" ? "bg-green-500 text-white" : type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}