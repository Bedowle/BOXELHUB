// components/footer.js

class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .footer { background: #1f2937; color: white; }
        .footer-link { transition: color 0.3s ease; }
        .footer-link:hover { color: #60a5fa; }
      </style>
      <footer class="footer">
        <div class="container mx-auto px-4 py-8">
          <div class="grid md:grid-cols-4 gap-8">
            <!-- Company Info -->
            <div>
              <div class="flex items-center space-x-2 mb-4">
                <i data-feather="printer" class="text-blue-400"></i>
                <span class="text-xl font-bold">VoxelHub</span>
              </div>
              <p class="text-gray-400">
                Conectamos makers con clientes para impresión 3D de calidad
              </p>
            </div>

            <!-- Quick Links -->
            <div>
              <h4 class="font-semibold mb-4">Enlaces rápidos</h4>
              <ul class="space-y-2">
                <li><a href="index.html" class="footer-link text-gray-400 hover:text-blue-400">Inicio</a></li>
                <li><a href="about.html" class="footer-link text-gray-400 hover:text-blue-400">Acerca de</a></li>
                <li><a href="contact.html" class="footer-link text-gray-400 hover:text-blue-400">Contacto</a></li>
                <li><a href="faq.html" class="footer-link text-gray-400 hover:text-blue-400">FAQ</a></li>
                <li><a href="register.html" class="footer-link text-gray-400 hover:text-blue-400">Registrarse</a></li>
              </ul>
            </div>

            <!-- Legal -->
            <div>
              <h4 class="font-semibold mb-4">Legal</h4>
              <ul class="space-y-2">
                <li><a href="privacy.html" class="footer-link text-gray-400 hover:text-blue-400">Privacidad</a></li>
                <li><a href="terms.html" class="footer-link text-gray-400 hover:text-blue-400">Términos</a></li>
                <li><a href="cookies.html" class="footer-link text-gray-400 hover:text-blue-400">Cookies</a></li>
              </ul>
            </div>

            <!-- Contact -->
            <div>
              <h4 class="font-semibold mb-4">Contacto</h4>
              <div class="space-y-2 text-gray-400">
                <div class="flex items-center space-x-2">
                  <i data-feather="mail" class="w-4 h-4"></i>
                  <span>info@printbid.com</span>
                </div>
                <div class="flex items-center space-x-2">
                  <i data-feather="phone" class="w-4 h-4"></i>
                  <span>+34 123 456 789</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="border-t border-gray-600 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VoxelHub Marketplace. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('custom-footer', CustomFooter);