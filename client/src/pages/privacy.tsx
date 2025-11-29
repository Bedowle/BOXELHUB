import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function Privacy() {
  const [, setLocation] = useLocation();
  const [copiedForm, setCopiedForm] = useState(false);

  const handleBack = () => {
    const previousPath = localStorage.getItem('lastPath') || '/';
    setLocation(previousPath);
  };

  const handleCopyForm = () => {
    const formText = `SOLICITUD DE DERECHOS RGPD - VoxelHub

Datos del Usuario:
Nombre Completo: [Tu nombre]
Email: [Tu email]
Número de Usuario/ID: [Si lo tienes]

Derecho que Solicitas (marca uno):
☐ Acceso (art. 15) - Quiero recibir copia de mis datos
☐ Rectificación (art. 16) - Mis datos son inexactos
☐ Supresión (art. 17) - Quiero que se eliminen mis datos
☐ Limitación (art. 18) - Quiero limitar el uso de mis datos
☐ Portabilidad (art. 20) - Quiero mis datos en formato estructurado
☐ Oposición (art. 21) - Me opongo a ciertos tratamientos
☐ Decisiones automatizadas (art. 22) - Afectado por decisiones automatizadas

Descripción Detallada de tu Solicitud:
[Explica con detalle qué solicitas]

Autorizo a VoxelHub a contactarme en:
Email: [Tu email]
Teléfono: [Opcional]

Fecha: [Completa la fecha de hoy]
Firma: [Tu nombre]

---
Envía este formulario a: support@voxelhub.com
Asunto: SOLICITUD DERECHOS RGPD`;
    navigator.clipboard.writeText(formText);
    setCopiedForm(true);
    setTimeout(() => setCopiedForm(false), 2000);
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
        {/* RESUMEN EJECUTIVO */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-lg mb-3">Resumen de tu Privacidad</h2>
          <ul className="space-y-2 text-sm">
            <li><strong>✓ Tus datos son tuyos:</strong> VoxelHub es una plataforma P2P que conecta clientes y makers. Recopilamos datos solo para facilitar transacciones y mejorar tu experiencia, y los protegemos con encriptación de nivel empresarial.</li>
            <li><strong>✓ Tienes derechos completos:</strong> Puedes acceder, modificar, eliminar u exportar tus datos en cualquier momento. Responderemos a cualquier solicitud en máximo 30 días conforme al RGPD.</li>
            <li><strong>✓ Transparencia total:</strong> Esta política detalla exactamente qué datos recogemos, por qué, quién los toca, cuánto tiempo los guardamos, y cómo puedes ejercer tus derechos.</li>
          </ul>
        </div>

        <div className="space-y-8 text-muted-foreground">
          {/* SECTION 1: RESPONSABLE */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Responsable del Tratamiento</h2>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <p><strong>Empresa:</strong> [PLACEHOLDER: Razón Social Legal]</p>
              <p><strong>CIF/NIF:</strong> [PLACEHOLDER: CIF/NIF]</p>
              <p><strong>Domicilio:</strong> [PLACEHOLDER: Dirección Legal]</p>
              <p><strong>Email de Contacto:</strong> support@voxelhub.com</p>
              <p><strong>Teléfono:</strong> [PLACEHOLDER: Teléfono de contacto]</p>
              <p><strong>Delegado de Protección de Datos (DPO):</strong> [PLACEHOLDER: Nombre y email] o contacta a support@voxelhub.com con asunto "ATENCIÓN: DPO"</p>
            </div>
          </section>

          {/* SECTION 2: DATOS RECOGIDOS */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. ¿Qué Datos Recogemos?</h2>
            <p className="mb-4">
              Recogemos diferentes tipos de datos según cómo uses VoxelHub. A continuación detallamos cada categoría, ejemplos y cómo los utilizamos:
            </p>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">📋 Datos de Identificación</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Nombre completo, email, número de teléfono, foto de perfil.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Al registrarte y actualizar tu perfil.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">📍 Datos de Ubicación</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Ciudad, región, país (para conectar usuarios cercanos).</p>
                <p className="text-sm"><strong>Cuándo:</strong> Durante el registro y actualización de perfil. No recogemos GPS en tiempo real.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">💳 Datos de Pago</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Número de cuenta, IBAN, información Stripe/PayPal (procesada por terceros).</p>
                <p className="text-sm"><strong>Cuándo:</strong> Solo para makers que solicitan pagos.</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2"><strong>⚠️ Importante:</strong> VoxelHub NO almacena números de tarjeta completos. Stripe y PayPal procesan datos sensibles con encriptación PCI-DSS.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">📁 Datos de Proyectos</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Archivos STL, descripciones de proyectos, especificaciones técnicas, presupuestos, ofertas.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Al crear proyectos, enviar ofertas o negociar con otros usuarios.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">💬 Datos de Comunicación</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Mensajes de chat, historial de conversaciones, comentarios y reseñas.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Al usar el chat de la plataforma.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">⭐ Datos de Reputación</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Calificaciones, reseñas, número de proyectos completados, tiempo medio de respuesta.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Después de completar proyectos.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">🖥️ Datos Técnicos</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Dirección IP, tipo de navegador, sistema operativo, cookies, identificador de dispositivo.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Automáticamente al acceder a la plataforma.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">🔐 Datos de Sesión</h3>
                <p className="text-sm mb-2"><strong>Qué recogemos:</strong> Token de sesión, historial de login, dispositivos conectados.</p>
                <p className="text-sm"><strong>Cuándo:</strong> Automáticamente cuando inicias sesión.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: BASES LEGALES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Bases Legales del Tratamiento (Art. 6 RGPD)</h2>
            <p className="mb-4">
              Procesamos tus datos bajo las siguientes bases legales conforme al RGPD:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-bold">✓ Cumplimiento de Contrato (Art. 6.1.b)</h3>
                <p className="text-sm mt-1">
                  <strong>Qué datos:</strong> Identificación, ubicación, proyectos, pagos, comunicaciones.
                </p>
                <p className="text-sm mt-1">
                  <strong>Por qué:</strong> Necesarios para que funcione VoxelHub: conectarte con otros usuarios, procesar transacciones, gestionar proyectos.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold">✓ Obligación Legal (Art. 6.1.c)</h3>
                <p className="text-sm mt-1">
                  <strong>Qué datos:</strong> Datos de pago, información de transacciones.
                </p>
                <p className="text-sm mt-1">
                  <strong>Por qué:</strong> Cumplimiento de normativas fiscales españolas y europeas (retención de 7 años).
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold">✓ Consentimiento (Art. 6.1.a)</h3>
                <p className="text-sm mt-1">
                  <strong>Qué datos:</strong> Email para marketing, cookies analíticas.
                </p>
                <p className="text-sm mt-1">
                  <strong>Por qué:</strong> Marketing y mejora de servicios. Puedes revocar en cualquier momento.
                </p>
              </div>
              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-bold">✓ Interés Legítimo (Art. 6.1.f)</h3>
                <p className="text-sm mt-1">
                  <strong>Qué datos:</strong> Datos técnicos, seguridad, fraude.
                </p>
                <p className="text-sm mt-1">
                  <strong>Por qué:</strong> Proteger la plataforma, prevenir fraude, mantener la seguridad de la comunidad.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: FINALIDADES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Finalidades del Tratamiento</h2>
            <p className="mb-4">
              Utilizamos tus datos para estas finalidades específicas:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">🎯 Facilitar Conexiones P2P</p>
                <p className="text-sm mt-1">Mostrar tu perfil a otros usuarios, conectarte con makers/clientes, facilitar negociación.</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">💰 Procesar Pagos</p>
                <p className="text-sm mt-1">Coordinar con Stripe/PayPal para procesar transacciones (coordinadas por usuarios, no intermediadas por VoxelHub).</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">📧 Comunicaciones</p>
                <p className="text-sm mt-1">Enviar notificaciones (nuevas ofertas, mensajes, actualizaciones de proyectos), alertas de seguridad, avisos legales.</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">📊 Análisis y Mejora</p>
                <p className="text-sm mt-1">Comprender cómo usas la plataforma, mejorar funcionalidades, identificar tendencias.</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">🔒 Seguridad y Prevención de Fraude</p>
                <p className="text-sm mt-1">Detectar actividad fraudulenta, proteger cuentas, cumplir regulaciones antilavado.</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">⚖️ Cumplimiento Legal</p>
                <p className="text-sm mt-1">Responder a solicitudes legales, auditorías, investigaciones de autoridades.</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="font-semibold">📢 Marketing (con consentimiento)</p>
                <p className="text-sm mt-1">Ofrecerte promociones, nuevas funciones, encuestas (solo si consientes).</p>
              </div>
            </div>
            <div className="mt-4 p-4 border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 rounded">
              <p className="font-semibold text-sm mb-2">⚠️ Consecuencias de No Facilitar Datos</p>
              <ul className="text-sm space-y-1">
                <li>• Sin datos de identificación → No puedes crear cuenta</li>
                <li>• Sin ubicación → No podemos conectarte con makers locales</li>
                <li>• Sin datos de pago (makers) → No puedes recibir pagos</li>
                <li>• Sin consentimiento a comunicaciones → No recibirás notificaciones esenciales</li>
              </ul>
            </div>
          </section>

          {/* SECTION 5: RETENCIONES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Períodos de Retención de Datos</h2>
            <p className="mb-4">
              Conservamos cada tipo de dato solo mientras sea necesario según la finalidad y la ley:
            </p>
            <div className="space-y-2">
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Datos de Cuenta Activa</span>
                <span className="text-sm">Mientras tu cuenta esté activa</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Datos de Transacciones</span>
                <span className="text-sm">7 años (obligación fiscal)</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Chat y Mensajes</span>
                <span className="text-sm">90 días tras cierre de proyecto</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Cookies de Sesión</span>
                <span className="text-sm">Hasta logout (máx 30 días)</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Datos Técnicos/IP</span>
                <span className="text-sm">Máximo 12 meses</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Logs de Seguridad</span>
                <span className="text-sm">Máximo 30 días</span>
              </div>
              <div className="flex justify-between p-3 border rounded">
                <span className="font-semibold">Cuenta Eliminada (archivos)</span>
                <span className="text-sm">7 años en backup (legal)</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded">
              <p className="text-sm">
                <strong>Nota:</strong> Los períodos se cuentan desde la última actividad o desde el evento que genera la obligación (ej: fin de transacción, cierre de proyecto). Después del período, los datos se eliminan permanentemente de nuestros sistemas.
              </p>
            </div>
          </section>

          {/* SECTION 6: COOKIES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Cookies y Tecnologías de Seguimiento</h2>
            <p className="mb-4">
              VoxelHub utiliza cookies para mejorar tu experiencia. Las clasificamos así:
            </p>
            <div className="space-y-3 mb-4">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <h4 className="font-bold">✓ COOKIES ESENCIALES (Siempre Activas)</h4>
                <p className="text-sm mt-2"><strong>Qué son:</strong> Autenticación, sesión, CSRF, seguridad.</p>
                <p className="text-sm mt-1"><strong>Duración:</strong> Sesión + 30 días.</p>
                <p className="text-sm mt-1"><strong>Base legal:</strong> Cumplimiento de contrato.</p>
                <p className="text-sm mt-1 font-semibold">→ No requieren consentimiento previo.</p>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-bold">📊 COOKIES ANALÍTICAS (Requieren Consentimiento)</h4>
                <p className="text-sm mt-2"><strong>Qué son:</strong> Google Analytics, Hotjar (análisis de comportamiento).</p>
                <p className="text-sm mt-1"><strong>Duración:</strong> 24 meses.</p>
                <p className="text-sm mt-1"><strong>Base legal:</strong> Consentimiento explícito.</p>
                <p className="text-sm mt-1"><strong>Ejemplos:</strong> Páginas visitadas, tiempo en sitio, dispositivo usado.</p>
              </div>
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
                <h4 className="font-bold">🎯 COOKIES DE MARKETING (Requieren Consentimiento)</h4>
                <p className="text-sm mt-2"><strong>Qué son:</strong> Seguimiento de conversiones, retargeting (Facebook Ads, Google Ads).</p>
                <p className="text-sm mt-1"><strong>Duración:</strong> 12 meses.</p>
                <p className="text-sm mt-1"><strong>Base legal:</strong> Consentimiento explícito.</p>
                <p className="text-sm mt-1"><strong>Ejemplos:</strong> Anuncios personalizados basados en tu navegación.</p>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="font-bold mb-2">🍪 Gestionar Cookies</p>
              <ul className="text-sm space-y-2">
                <li><strong>Revocar consentimiento:</strong> [PLACEHOLDER: Link a cookie settings]</li>
                <li><strong>Rechazar nuevas cookies:</strong> Configuración → Privacidad → Cookies</li>
                <li><strong>Usar "Do Not Track":</strong> Navegador → Privacidad → Enviar DNT</li>
                <li><strong>Cookies de terceros:</strong> Gestiona en tu navegador directamente</li>
              </ul>
              <p className="text-sm mt-3"><strong>Política de Cookies detallada:</strong> <span className="text-primary cursor-pointer hover:underline">[PLACEHOLDER: Link a cookies.html]</span></p>
            </div>
          </section>

          {/* SECTION 7: ENCARGADOS Y PROVEEDORES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Encargados de Tratamiento y Terceros</h2>
            <p className="mb-4">
              Estos son los terceros que acceden a tus datos (con contratos DPA):
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">💳 Proveedores de Pago</h4>
                <div className="text-sm mt-2 space-y-1">
                  <p><strong>Stripe:</strong> Procesamiento de tarjetas | www.stripe.com/privacy | USA (con SCC)</p>
                  <p><strong>PayPal:</strong> Procesamiento de transferencias | www.paypal.com/privacy | USA (con SCC)</p>
                  <p className="font-semibold mt-2">→ Contrato DPA en vigor. Cumplen PCI-DSS.</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">🗄️ Bases de Datos y Almacenamiento</h4>
                <div className="text-sm mt-2 space-y-1">
                  <p><strong>Neon (PostgreSQL):</strong> Base de datos | www.neon.tech/privacy | UE (Bélgica)</p>
                  <p><strong>AWS S3:</strong> Almacenamiento de archivos STL | aws.amazon.com/privacy | UE (Frankfurt)</p>
                  <p className="font-semibold mt-2">→ Contrato DPA en vigor. Dentro de EEE.</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📧 Correo y Comunicaciones</h4>
                <div className="text-sm mt-2 space-y-1">
                  <p><strong>SendGrid:</strong> Envío de emails | www.sendgrid.com/policies/privacy | USA (con SCC)</p>
                  <p className="font-semibold mt-2">→ Contrato DPA en vigor.</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📊 Análisis</h4>
                <div className="text-sm mt-2 space-y-1">
                  <p><strong>Google Analytics:</strong> Análisis web | policies.google.com/privacy | USA (con SCC)</p>
                  <p className="font-semibold mt-2">→ Contrato DPA en vigor. IP anonimizada.</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">⚠️ Nota Importante</h4>
                <p className="text-sm mt-2">
                  <strong>No compartimos:</strong> No vendemos datos a terceros. Solo compartimos datos con proveedores necesarios para operar VoxelHub, bajo contrato DPA.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 8: TRANSFERENCIAS INTERNACIONALES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Transferencias Internacionales (Art. 44-50 RGPD)</h2>
            <p className="mb-4">
              Algunos de nuestros proveedores están fuera del EEE. Aquí cómo protegemos tus datos:
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">🌍 Países Receptores</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>🇺🇸 <strong>USA:</strong> Stripe, PayPal, Google Analytics, SendGrid</li>
                  <li>🌐 <strong>EEE:</strong> Neon (Bélgica), AWS Frankfurt</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-bold">🔐 Mecanismo de Transferencia: Cláusulas Contractuales Tipo (SCC)</h4>
                <p className="text-sm mt-2">
                  Para transferencias a USA (no incluido en lista blanca RGPD), utilizamos Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.
                </p>
                <p className="text-sm mt-2 font-semibold">
                  → Efecto Schrems II: Hemos evaluado las leyes de vigilancia del país destino (Patriot Act, FISA). Medidas compensatorias en vigor.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📋 Evaluación de Riesgos</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>✓ Proveedores certificados Privacy Shield o comprometidos con Cláusulas Tipo</li>
                  <li>✓ Encriptación de datos en tránsito (TLS 1.2+)</li>
                  <li>✓ Minimización: Solo datos necesarios</li>
                  <li>✓ Auditorías de seguridad anuales</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 9: SEGURIDAD */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Medidas de Seguridad (Art. 32 RGPD)</h2>
            <p className="mb-4">
              Implementamos medidas técnicas y organizativas avanzadas:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-3">
                <h4 className="font-bold">🔐 Encriptación</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• <strong>En tránsito:</strong> TLS 1.2+ (HTTPS en todo el sitio)</li>
                  <li>• <strong>En reposo:</strong> AES-256 para datos sensibles</li>
                  <li>• <strong>Contraseñas:</strong> bcrypt con salt (nunca en texto plano)</li>
                </ul>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-3">
                <h4 className="font-bold">🛡️ Autenticación</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Replit Auth (OIDC) - OAuth 2.0 seguro</li>
                  <li>• Sessions seguras con httpOnly cookies</li>
                  <li>• CSRF tokens en formularios</li>
                </ul>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-3">
                <h4 className="font-bold">🚨 Monitoreo</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Logs de acceso y auditoría (30 días)</li>
                  <li>• Alertas de actividad sospechosa en tiempo real</li>
                  <li>• Análisis de intentos de acceso no autorizados</li>
                </ul>
              </div>
              <div className="border-l-4 border-orange-500 pl-4 py-3">
                <h4 className="font-bold">🔑 Control de Acceso</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Control de acceso basado en roles (RBAC)</li>
                  <li>• Principio de mínimo privilegio</li>
                  <li>• Revisión trimestral de permisos</li>
                </ul>
              </div>
              <div className="border-l-4 border-red-500 pl-4 py-3">
                <h4 className="font-bold">🧪 Pruebas de Seguridad</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Auditorías de seguridad anuales (terceros)</li>
                  <li>• Penetration testing semestral</li>
                  <li>• Parches de seguridad aplicados en 72h</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 10: DERECHOS DEL USUARIO */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Tus Derechos (Art. 15-22 RGPD)</h2>
            <p className="mb-4">
              Conforme al RGPD, tienes estos derechos. Puedes ejercerlos escribiéndonos a support@voxelhub.com.
            </p>
            <div className="space-y-3 mb-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">1️⃣ Derecho de Acceso (Art. 15)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Obtener confirmación de si procesamos tus datos y recibir copia.
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "Quiero saber qué datos tiene VoxelHub sobre mí."
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> 30 días desde la solicitud.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">2️⃣ Derecho de Rectificación (Art. 16)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Corregir datos inexactos o incompletos.
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "Mi email está mal en vuestro sistema."
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> 30 días.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">3️⃣ Derecho de Supresión (Art. 17) - "Derecho al Olvido"</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Pedir que eliminemos tus datos en ciertas circunstancias.
                </p>
                <p className="text-sm mt-1">
                  <strong>Cuándo aplica:</strong> Ya no necesitas el servicio, retiras consentimiento, datos ilegales.
                </p>
                <p className="text-sm mt-1">
                  <strong>⚠️ Excepciones:</strong> Si debemos guardar datos por obligación fiscal (7 años), archivamos en lugar de eliminar.
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> 30 días.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">4️⃣ Derecho a Limitar Tratamiento (Art. 18)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Restringir cómo usamos tus datos (no eliminarlos, solo limitar uso).
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "Quiero que no uséis mis datos para marketing, solo para transacciones."
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> 30 días.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">5️⃣ Derecho a la Portabilidad (Art. 20)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Recibir tus datos en formato estructurado (CSV, JSON) para trasladarlos a otro servicio.
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "Quiero exportar mi historial de proyectos y reseñas."
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> 30 días.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">6️⃣ Derecho de Oposición (Art. 21)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> Oponerse a tratamientos basados en interés legítimo o marketing.
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "No quiero recibir emails de marketing."
                </p>
                <p className="text-sm mt-1">
                  <strong>Plazo:</strong> Inmediato para marketing; 30 días para otros.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">7️⃣ Derechos Relacionados con Decisiones Automatizadas (Art. 22)</h4>
                <p className="text-sm mt-2">
                  <strong>Qué es:</strong> No estar sujeto a decisiones completamente automatizadas con efectos legales.
                </p>
                <p className="text-sm mt-1">
                  <strong>Ejemplo:</strong> "Mi cuenta fue bloqueada sin revisión humana."
                </p>
                <p className="text-sm mt-1">
                  <strong>⚠️ En VoxelHub:</strong> No usamos decisiones totalmente automatizadas. Siempre hay revisión humana en bloqueos o rechazos.
                </p>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">📋 Solicitar tus Derechos</h3>
              <p className="text-sm mb-4">
                Utiliza este formulario para solicitar cualquiera de tus derechos. Lo puedes copiar y enviar a support@voxelhub.com con asunto "SOLICITUD DERECHOS RGPD".
              </p>
              <Button
                variant="outline"
                onClick={handleCopyForm}
                className="w-full"
                data-testid="button-copy-form"
              >
                {copiedForm ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado al Portapapeles
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Formulario
                  </>
                )}
              </Button>
            </div>

            {/* PROCESO DE VERIFICACIÓN */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-bold mb-3">🔐 Proceso de Verificación</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Recibes tu solicitud</li>
                <li>Verificamos tu identidad (coincidencia email/teléfono o copia de ID)</li>
                <li>Procesamos tu solicitud en máximo 30 días</li>
                <li>Te contactamos con el resultado</li>
                <li>Gastos: Gratuito (a menos que sea infundada o excesiva)</li>
              </ol>
            </div>
          </section>

          {/* SECTION 11: MENORES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Protección de Menores</h2>
            <p className="mb-4">
              VoxelHub está diseñado para usuarios adultos. Información sobre menores:
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">👤 Edad Mínima</h4>
                <p className="text-sm mt-2">
                  <strong>Requerimiento:</strong> Debes tener al menos <strong>18 años</strong> para usar VoxelHub.
                </p>
                <p className="text-sm mt-2">
                  <strong>Verificación:</strong> Al registrarte confirmas que tienes 18+ años.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">👨‍👩‍👦 Si eres Menor de Edad</h4>
                <p className="text-sm mt-2">
                  Si tienes menos de 18 años, NO puedes usar VoxelHub. Los padres que encuentren a menores pueden reportarlo a support@voxelhub.com.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">🗑️ Si Creaste Cuenta Siendo Menor</h4>
                <p className="text-sm mt-2">
                  Contacta a support@voxelhub.com indicando tu edad y solicitaremos la eliminación de tus datos conforme a Art. 17 RGPD.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 12: PERFILADO */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Perfilado y Automatización</h2>
            <p className="mb-4">
              Información sobre si usamos automatización para decidir sobre ti:
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <h4 className="font-bold">✓ Decisiones Automatizadas SIN Efectos Legales</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>Recomendaciones de proyectos (pueden variar manualmente)</li>
                  <li>Ordenación de resultados de búsqueda</li>
                  <li>Sugerencias de makers similares</li>
                </ul>
                <p className="text-sm mt-2">→ <strong>Puedes oponerte:</strong> Configuración → Privacidad → Personalización</p>
              </div>
              <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                <h4 className="font-bold">❌ Decisiones Automatizadas CON Efectos Legales: NO</h4>
                <p className="text-sm mt-2">
                  VoxelHub NO toma decisiones completamente automatizadas que afecten legalmente:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>Aceptación/Rechazo de proyectos</li>
                  <li>Bloqueo de cuenta</li>
                  <li>Cancelación de pagos</li>
                </ul>
                <p className="text-sm mt-2">
                  Si ocurre algo así, siempre hay <strong>revisión manual por un humano</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 13: DPIA */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">13. Evaluaciones de Impacto (DPIA) y Registros</h2>
            <p className="mb-4">
              VoxelHub mantiene documentación según RGPD:
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📋 Registro de Actividades de Tratamiento</h4>
                <p className="text-sm mt-2">
                  Mantenemos un registro de toda actividad de datos conforme al Art. 30 RGPD.
                </p>
                <p className="text-sm mt-2">
                  <strong>Solicitar acceso:</strong> Email a support@voxelhub.com con asunto "SOLICITUD REGISTRO ACTIVIDADES ARTÍCULO 30"
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">🔍 Evaluaciones de Impacto (DPIA)</h4>
                <p className="text-sm mt-2">
                  Realizamos DPIA cuando el tratamiento presenta riesgo (Art. 35 RGPD).
                </p>
                <p className="text-sm mt-2">
                  <strong>Ejemplos:</strong> Análisis de reputación automatizado, decisiones de pago, perfilado.
                </p>
                <p className="text-sm mt-2">
                  <strong>Solicitar resumen:</strong> Email a support@voxelhub.com (respuesta en 30 días)
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 14: INCIDENTES */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">14. Incidentes de Seguridad (Art. 33-34 RGPD)</h2>
            <p className="mb-4">
              Si ocurre un incidente de seguridad que afecte tus datos:
            </p>
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                <h4 className="font-bold text-red-700 dark:text-red-400">🚨 Procedimiento de Notificación</h4>
                <ol className="text-sm mt-2 space-y-2 list-decimal list-inside">
                  <li>VoxelHub detecta el incidente</li>
                  <li>Evaluamos el riesgo en 72h</li>
                  <li>Si hay riesgo alto, notificamos a AEPD (autoridad) sin demora</li>
                  <li>Te notificamos directamente si tu riesgo es alto</li>
                  <li>Investigamos causa y aplicamos medidas correctoras</li>
                </ol>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📧 Cómo Te Notificamos</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>Por email a tu dirección registrada</li>
                  <li>O por notificación en la plataforma</li>
                  <li>Incluirá: qué pasó, riesgo, medidas, contacto</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">📞 Reportar un Incidente</h4>
                <p className="text-sm mt-2">
                  Si crees que tus datos han sido comprometidos:
                </p>
                <p className="text-sm mt-2 font-semibold">
                  Email: support@voxelhub.com con asunto "INCIDENTE DE SEGURIDAD"
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 15: CAMBIOS */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">15. Cambios en Esta Política</h2>
            <p className="mb-4">
              VoxelHub puede actualizar esta política en cualquier momento.
            </p>
            <div className="space-y-2">
              <p className="text-sm"><strong>✓ Cambios menores:</strong> Actualizamos en el sitio, sin notificación especial.</p>
              <p className="text-sm"><strong>⚠️ Cambios significativos:</strong> Te notificamos por email con 30 días de anticipación.</p>
              <p className="text-sm"><strong>📅 Fecha última actualización:</strong> [PLACEHOLDER: Fecha]</p>
              <p className="text-sm"><strong>📜 Versión anterior:</strong> <span className="text-primary cursor-pointer hover:underline">[PLACEHOLDER: Link a archivo]</span></p>
            </div>
          </section>

          {/* SECTION 16: CONTACTO RGPD */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">16. Contacto y Autoridades</h2>
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-primary/5">
                <h4 className="font-bold">📧 Para Cualquier Duda sobre Privacidad</h4>
                <p className="text-sm mt-2">
                  <strong>Email:</strong> support@voxelhub.com
                </p>
                <p className="text-sm mt-1">
                  <strong>Asuntos comunes:</strong>
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• "SOLICITUD DERECHOS RGPD" - Ejercer derechos</li>
                  <li>• "ATENCIÓN: DPO" - Contactar al Delegado</li>
                  <li>• "INCIDENTE DE SEGURIDAD" - Reportar brechas</li>
                  <li>• "SOLICITUD REGISTRO ACTIVIDADES ART. 30" - Ver registros</li>
                </ul>
                <p className="text-sm mt-2">
                  <strong>Plazo de respuesta:</strong> Máximo 30 días
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold">🏛️ Autoridades de Protección de Datos</h4>
                <p className="text-sm mt-2">
                  Si no estás satisfecho con cómo tratamos tu privacidad, tienes derecho a presentar una reclamación ante la autoridad:
                </p>
                <p className="text-sm mt-3">
                  <strong>España:</strong> Agendalía Española de Protección de Datos (AEPD)<br />
                  www.aepd.es | (+34) 901 100 099
                </p>
                <p className="text-sm mt-2">
                  <strong>Otros países EU:</strong> Consulta la web de tu autoridad local
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8 space-y-3">
            <div>
              <p className="font-bold">📅 Última Actualización</p>
              <p className="text-sm">[PLACEHOLDER: Fecha de actualización]</p>
            </div>
            <div>
              <p className="font-bold">✅ Compliance Checklist</p>
              <p className="text-sm">Esta política cumple con RGPD (UE) 2016/679, LSSI-CE (España), y recomendaciones EDPB/AEPD.</p>
            </div>
            <div>
              <p className="font-bold">🔒 Tu Privacidad es Importante</p>
              <p className="text-sm">Nos comprometemos a proteger tus derechos de privacidad. Si tienes alguna duda o sugerencia, no dudes en contactarnos.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
