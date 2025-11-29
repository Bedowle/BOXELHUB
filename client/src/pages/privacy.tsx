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
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Política de Privacidad</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Información del Responsable del Tratamiento</h2>
            <p>
              VoxelHub es el responsable del tratamiento de tus datos personales conforme a la Reglamento General de Protección de Datos (RGPD) (UE) 2016/679 y la normativa europea aplicable.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Contacto: support@voxelhub.com</li>
              <li>Finalidad: Gestión del marketplace P2P de impresión 3D</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Recopilación y Categorías de Datos Personales</h2>
            <p>
              VoxelHub recopila información personal cuando te registras, usas nuestros servicios y realizas transacciones. Los datos que recopilamos incluyen:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Datos de identificación: Nombre, email, número de teléfono</li>
              <li>Datos de perfil: Foto de perfil, ubicación, biografía</li>
              <li>Datos de transacción: Historial de proyectos, ofertas, mensajes</li>
              <li>Datos técnicos: Dirección IP, cookies, datos de dispositivo</li>
              <li>Archivos: Archivos STL y documentos relacionados con proyectos</li>
              <li>Datos de pago: Información necesaria para procesar pagos (procesada por terceros asegurados)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Base Legal del Tratamiento</h2>
            <p>
              Tratamos tus datos personales conforme a las siguientes bases legales (artículos 6 RGPD):
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Consentimiento:</strong> Para tratamientos no esenciales</li>
              <li><strong>Cumplimiento de contrato:</strong> Para facilitar transacciones y servicios</li>
              <li><strong>Obligación legal:</strong> Para cumplir normas fiscales y de protección del consumidor</li>
              <li><strong>Interés legítimo:</strong> Para mejorar servicios y prevenir fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Finalidades del Tratamiento</h2>
            <p>
              Utilizamos tu información para:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Procesar transacciones y pagos</li>
              <li>Facilitar la comunicación entre clientes y makers</li>
              <li>Enviar notificaciones de proyectos, ofertas y mensajes</li>
              <li>Crear y mantener tu perfil</li>
              <li>Mejora de nuestros servicios y experiencia de usuario</li>
              <li>Protección contra fraude y seguridad</li>
              <li>Cumplimiento de obligaciones legales y fiscales</li>
              <li>Análisis estadístico y marketing (con consentimiento)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Conservación de Datos</h2>
            <p>
              Conservamos tus datos personales únicamente durante el tiempo necesario:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Datos de cuenta activa:</strong> Mientras tu cuenta esté activa</li>
              <li><strong>Datos de transacciones:</strong> 7 años (cumplimiento fiscal)</li>
              <li><strong>Datos de comunicaciones:</strong> 90 días después del cierre de proyecto</li>
              <li><strong>Datos técnicos y cookies:</strong> Máximo 12 meses</li>
              <li><strong>Datos de registro (logs):</strong> Máximo 30 días</li>
            </ul>
            <p className="mt-2">
              Al eliminar tu cuenta, archivamos datos críticos por 7 años conforme a obligaciones legales, tras lo cual se eliminan permanentemente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Compartición de Datos</h2>
            <p>
              VoxelHub comparte datos personales solo cuando es necesario:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Otros usuarios:</strong> Tu perfil es visible a clientes/makers (nombre, ubicación, ratings)</li>
              <li><strong>Proveedores de pago:</strong> Stripe, PayPal (asegurados con contratos DPA)</li>
              <li><strong>Servicios de almacenamiento:</strong> Neon (servidores en EU)</li>
              <li><strong>Autoridades legales:</strong> Cuando la ley lo requiera</li>
            </ul>
            <p className="mt-2">
              No vendemos ni compartimos tus datos con terceros sin tu consentimiento explícito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Protección de Datos y Seguridad</h2>
            <p>
              VoxelHub implementa medidas de seguridad avanzadas conforme al artículo 32 RGPD:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Encriptación de datos en tránsito (SSL/TLS) y en reposo</li>
              <li>Servidores seguros en centros de datos certificados en la UE</li>
              <li>Autenticación mediante sesiones seguras</li>
              <li>Auditorías de seguridad y monitoreo continuo</li>
              <li>Control de acceso basado en roles</li>
              <li>Cumplimiento de estándares ISO 27001</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              VoxelHub utiliza cookies y tecnologías similares:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Cookies esenciales:</strong> Para autenticación y funcionamiento de la plataforma</li>
              <li><strong>Cookies de preferencias:</strong> Para guardar idioma y tema oscuro/claro</li>
              <li><strong>Cookies analíticas:</strong> Para mejorar la experiencia (con consentimiento)</li>
            </ul>
            <p className="mt-2">
              Puedes gestionar tus preferencias de cookies en la configuración de tu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Derechos del Usuario (RGPD)</h2>
            <p>
              Conforme al RGPD, tienes los siguientes derechos:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Derecho de acceso (art. 15):</strong> Obtener copia de tus datos</li>
              <li><strong>Derecho de rectificación (art. 16):</strong> Corregir datos inexactos</li>
              <li><strong>Derecho de supresión (art. 17):</strong> "Derecho al olvido" en ciertas circunstancias</li>
              <li><strong>Derecho a limitar el tratamiento (art. 18):</strong> Restringir cómo se usan tus datos</li>
              <li><strong>Derecho a la portabilidad (art. 20):</strong> Recibir tus datos en formato estructurado</li>
              <li><strong>Derecho de oposición (art. 21):</strong> Oponerse a ciertos tratamientos</li>
              <li><strong>Derechos relacionados con decisiones automatizadas (art. 22):</strong> No estar sujeto a decisiones completamente automatizadas</li>
            </ul>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, contáctanos en support@voxelhub.com. Responderemos en el plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Transferencias Internacionales</h2>
            <p>
              VoxelHub almacena y procesa datos dentro del Espacio Económico Europeo (EEE). En caso de transferencias fuera del EEE, utilizamos mecanismos reconocidos conforme al RGPD (Cláusulas Contractuales Tipo).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Incidentes de Seguridad</h2>
            <p>
              En caso de un incidente de seguridad que comprometa tus datos personales, VoxelHub:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Evaluará el riesgo inmediatamente</li>
              <li>Notificará a las autoridades de protección de datos en un plazo máximo de 72 horas (si es requerido)</li>
              <li>Te informará directamente si existe un alto riesgo para tus derechos y libertades</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Decisiones Automatizadas y Perfilado</h2>
            <p>
              VoxelHub no realiza decisiones completamente automatizadas que produzcan efectos legales o significativos sobre ti, tales como aceptación/rechazo automático de proyectos o restricción de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">13. Derechos de Reclamación</h2>
            <p>
              Si consideras que VoxelHub ha violado tus derechos de protección de datos conforme al RGPD, tienes derecho a presentar una reclamación ante la Autoridad de Protección de Datos de tu país:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>España:</strong> Agendalía Española de Protección de Datos (AEPD) - www.aepd.es</li>
              <li><strong>Otros países EU:</strong> Consulta la Autoridad local de Protección de Datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">14. Cambios en esta Política</h2>
            <p>
              VoxelHub puede actualizar esta política de privacidad en cualquier momento. Te notificaremos de cambios significativos por email o mediante aviso en la plataforma.
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm font-semibold">
              Última actualización: Noviembre 2024
            </p>
            <p className="text-sm mt-3">
              <strong>Para solicitar información, ejercer derechos o reportar incidentes:</strong>
            </p>
            <p className="text-sm mt-2">
              Email: support@voxelhub.com
            </p>
            <p className="text-sm mt-2 text-amber-600 dark:text-amber-400">
              Tus derechos de privacidad son fundamentales. Nos comprometemos a proteger tu información conforme a la legislación europea más rigurosa.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
