import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    const previousPath = localStorage.getItem('lastPath') || '/';
    setLocation(previousPath);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Política de Privacidad</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-lg mb-3">Tu Privacidad es Importante</h2>
          <p className="text-sm">
            VoxelHub es una plataforma P2P que conecta clientes y makers. Esta política explica cómo protegemos tu privacidad conforme a la ley europea (RGPD).
          </p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          {/* SECTION 1: RESPONSABLE */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Responsable del Tratamiento</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Plataforma:</strong> VoxelHub</p>
              <p><strong>Email de Contacto:</strong> support@voxelhub.com</p>
              <p><strong>Jurisdicción:</strong> España - Regulado bajo RGPD</p>
            </div>
          </section>

          {/* SECTION 2: COOKIES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Cookies y Tecnologías de Seguimiento</h2>
            
            <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-3">✓ SOLO COOKIES ESENCIALES</h3>
              <p className="text-sm mb-3">
                VoxelHub utiliza únicamente cookies técnicas/esenciales para autenticación y seguridad.
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold">🔐 session_id</p>
                  <p className="text-xs mt-1">Mantiene tu sesión segura. Dura hasta logout o 30 días máximo.</p>
                </div>
                <div>
                  <p className="font-bold">🛡️ csrf_token</p>
                  <p className="text-xs mt-1">Protege contra ataques de seguridad. Se renombra cada sesión.</p>
                </div>
                <div>
                  <p className="font-bold">📌 theme_preference</p>
                  <p className="text-xs mt-1">Guarda tu preferencia de tema claro/oscuro. Dura 1 año.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-sm">🚫 Qué NO hacemos</h4>
              <ul className="text-sm space-y-1">
                <li>❌ No usamos Google Analytics</li>
                <li>❌ No usamos cookies de publicidad o retargeting</li>
                <li>❌ No rastreamos comportamiento entre sitios</li>
                <li>❌ No vendemos datos a terceros</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3: SEGURIDAD */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Seguridad de tus Datos</h2>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-sm">🔐 Encriptación</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• HTTPS/TLS 1.2+ en todo el sitio</li>
                  <li>• Contraseñas encriptadas con bcrypt</li>
                  <li>• Datos sensibles con AES-256</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-sm">🛡️ Control de Acceso</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Autenticación segura con tokens JWT</li>
                  <li>• Validación en cada petición</li>
                  <li>• Sesiones con httpOnly cookies</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-sm">📋 Auditoría</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Logs de acceso (máximo 30 días)</li>
                  <li>• Alertas de actividad sospechosa</li>
                  <li>• Revisión periódica de seguridad</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 4: DERECHOS */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Tus Derechos (RGPD)</h2>
            <p className="text-sm mb-4">Conforme al RGPD, tienes estos derechos. Escribe a support@voxelhub.com con asunto "SOLICITUD RGPD":</p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <p className="font-bold text-sm">Acceso (Art. 15)</p>
                <p className="text-xs mt-1">Recibir copia de tus datos personales</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-bold text-sm">Rectificación (Art. 16)</p>
                <p className="text-xs mt-1">Corregir datos inexactos</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-bold text-sm">Supresión (Art. 17)</p>
                <p className="text-xs mt-1">Solicitar eliminación de datos</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-bold text-sm">Portabilidad (Art. 20)</p>
                <p className="text-xs mt-1">Recibir tus datos en formato estructurado</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-bold text-sm">Oposición (Art. 21)</p>
                <p className="text-xs mt-1">Oponerme a ciertos tratamientos</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded">
              <p className="text-sm"><strong>Plazo de respuesta:</strong> Máximo 30 días desde tu solicitud.</p>
            </div>
          </section>

          {/* SECTION 5: CONTACTO */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Contacto</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Para consultas sobre privacidad:</strong></p>
              <p>📧 support@voxelhub.com</p>
              <p className="text-xs mt-3">Asunto recomendado: "SOLICITUD RGPD" o "CONSULTA PRIVACIDAD"</p>
            </div>
          </section>

          {/* ÚLTIMA ACTUALIZACIÓN */}
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            <p>Última actualización: Noviembre 2025</p>
          </div>
        </div>
      </main>
    </div>
  );
}
