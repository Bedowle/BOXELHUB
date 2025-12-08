// components/navbar.js
// Navbar mínimo y accesible. El estado visual se actualizará desde script.js cuando haya sesión.

class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<nav class="custom-navbar bg-white shadow p-4">
  <div class="container mx-auto flex items-center justify-between px-4">
    <!-- Izquierda: Logo + Nombre -->
    <div class="flex items-center gap-3">
      <a href="index.html" class="flex items-center gap-3">
        <div style="width:34px;height:34px;border:2px solid orange;display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18"></rect>
          </svg>
        </div>
        <span class="font-bold text-orange-500 text-lg">VoxelHub</span>
      </a>
    </div>

    <!-- Derecha: área que script.js actualizará según estado -->
    <div class="flex items-center gap-3">
      <a href="maker-register.html" class="px-4 py-2 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition">Tengo una Impresora 3D</a>
      <a href="login.html" class="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">Registrarse/Iniciar Sesión</a>
    </div>
  </div>
</nav>
`;
  }
}
customElements.define("custom-navbar", CustomNavbar);