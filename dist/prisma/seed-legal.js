"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const TERMINOS_CONTENT = `<p class="date">Versión vigente: 25 de mayo de 2026</p>

<h2>RESUMEN DE TÉRMINOS Y CONDICIONES</h2>
<p>NEXXOS es una plataforma tecnológica venezolana que ofrece servicios de emparejamiento entre <strong>CLIENTES</strong> (personas que necesitan repuestos, servicios o productos) y <strong>VENDEDORES</strong> (personas o negocios que ofrecen dichos productos o servicios), comenzando con el sector automotriz (repuestos).</p>
<p>Nuestros servicios incluyen:</p>
<ul>
<li><strong>Emparejamiento inteligente</strong> basado en ubicación geográfica, marca, modelo, categoría de repuesto, reputación y tiempo de respuesta.</li>
<li><strong>Verificación de identidad</strong> (documento + verificación facial) para vendedores.</li>
<li><strong>Chat en tiempo real</strong> entre cliente y vendedor.</li>
<li><strong>Notificaciones push</strong> sobre solicitudes y respuestas.</li>
</ul>
<p>Para operar en NEXXOS, todas las personas usuarias deberán aceptar estos Términos y Condiciones, la Política de Privacidad y las cláusulas específicas.</p>

<h2>1. NEXXOS</h2>
<p>NEXXOS es una plataforma tecnológica venezolana que facilita el encuentro entre clientes y vendedores mediante un sistema de solicitudes inteligentes y un algoritmo de emparejamiento basado en ubicación geográfica, compatibilidad de productos/servicios, reputación y tiempo de respuesta.</p>
<p>La plataforma opera a través de su sitio web y aplicaciones móviles (en adelante, la "App" o la "Plataforma").</p>

<h2>2. TÉRMINOS Y CONDICIONES</h2>
<p>Estos Términos y Condiciones, junto con la <a href="/privacidad">Política de Privacidad</a>, la Cláusula de Exoneración de Responsabilidad, la Verificación de Edad (LOPNNA) y los anexos aplicables, regulan la relación entre NEXXOS y las personas que usan sus servicios.</p>
<p>Las Personas Usuarias aceptan estos Términos al registrarse en la App. NEXXOS podrá modificar estos Términos en cualquier momento, notificando con <strong>al menos 10 días corridos de anticipación</strong>.</p>

<h2>3. CAPACIDAD Y VERIFICACIÓN DE EDAD (LOPNNA)</h2>
<p>Podrán usar NEXXOS las personas <strong>mayores de 18 años</strong> que tengan capacidad legal para contratar. De conformidad con la <strong>LOPNNA</strong>, queda estrictamente prohibido el registro de personas menores de 18 años.</p>

<h2>4. REGISTRO Y CUENTA</h2>
<p>La cuenta es <strong>personal, única e intransferible</strong>. Queda prohibido vender, ceder o compartir la cuenta con terceros. No está permitido crear múltiples cuentas.</p>

<h2>5. PRIVACIDAD DE DATOS</h2>
<p>NEXXOS protege la privacidad de las Personas Usuarias. Toda la información personal se maneja conforme a nuestra <a href="/privacidad">Política de Privacidad</a>.</p>

<h2>6. INFORMACIÓN COMERCIAL</h2>
<p>NEXXOS podrá usar de forma agregada y anonimizada la información generada por los usuarios para mejorar el algoritmo de emparejamiento y generar estadísticas internas. Esta información no será vendida a terceros en forma individualizada.</p>

<h2>7. SANCIONES</h2>
<p>En caso de incumplimiento, NEXXOS podrá aplicar: advertencia, suspensión temporal, inhabilitación permanente, eliminación de contenido ofensivo o retención de pagos pendientes.</p>

<h2>8. RESPONSABILIDAD Y EXONERACIÓN</h2>
<p>NEXXOS es una plataforma tecnológica de encuentro. <strong>NO ES PARTE</strong> de las transacciones entre clientes y vendedores, no almacena productos, no presta servicios físicos ni interviene en la negociación.</p>
<p>La Persona Usuaria reconoce que cualquier acuerdo con otro usuario es de su <strong>exclusiva responsabilidad</strong>.</p>

<h2>9. TARIFAS Y PAGOS FUTUROS</h2>
<p>NEXXOS podrá en el futuro cobrar tarifas por el uso de sus servicios (planes de suscripción, servicios destacados). Los precios serán publicados con al menos 10 días de anticipación.</p>

<h2>10. PROPIEDAD INTELECTUAL</h2>
<p>NEXXOS es titular de todos los derechos de propiedad intelectual sobre la App, su código fuente, diseño, base de datos, algoritmos, marcas y logotipos. Queda estrictamente prohibido copiar, modificar, descompilar o usar sistemas automatizados sin autorización.</p>

<h2>11. INDEMNIDAD</h2>
<p>La Persona Usuaria mantendrá indemne a NEXXOS por cualquier reclamo relacionado con sus actividades dentro o fuera de la plataforma.</p>

<h2>12. USO AUTOMATIZADO</h2>
<p>Queda expresamente prohibido el uso de bots, scrapers, crawlers o cualquier sistema automatizado para acceder a NEXXOS sin autorización.</p>

<h2>13. MODIFICACIONES Y VIGENCIA</h2>
<p>Estos Términos podrán ser modificados en cualquier momento, notificando con al menos 10 días de anticipación.</p>

<h2>14. LEY APLICABLE Y JURISDICCIÓN</h2>
<p>Estos Términos se rigen por las leyes de la República Bolivariana de Venezuela. Cualquier controversia será sometida a los tribunales de la ciudad de Maracaibo, estado Zulia.</p>

<h2>15. CONTACTO</h2>
<ul>
<li><strong>Atención al usuario:</strong> <a href="mailto:soporte@nexxos.app">soporte@nexxos.app</a></li>
<li><strong>Asuntos legales:</strong> <a href="mailto:legal@nexxos.app">legal@nexxos.app</a></li>
<li><strong>Alianzas comerciales:</strong> <a href="mailto:alianzas@nexxos.app">alianzas@nexxos.app</a></li>
</ul>`;
const PRIVACIDAD_CONTENT = `<p class="date">Versión vigente: 25 de mayo de 2026 · Próxima actualización: 25 de mayo de 2027</p>

<p>En NEXXOS, nos comprometemos a proteger tu privacidad y a tratar tus datos personales de manera transparente, segura y conforme a la legislación venezolana aplicable.</p>

<h2>1. INFORMACIÓN QUE RECOPILAMOS</h2>
<h3>a. Información que nos proporcionas directamente</h3>
<table><tr><th>Tipo de dato</th><th>Finalidad</th></tr>
<tr><td>Nombre, cédula, correo, teléfono</td><td>Identificación, registro, comunicación</td></tr>
<tr><td>Documento de identidad y verificación facial (solo vendedores)</td><td>Validación de identidad, prevención de fraude</td></tr>
<tr><td>Dirección fiscal / RIF (vendedores)</td><td>Facturación, cumplimiento tributario</td></tr>
<tr><td>Contenido de solicitudes, chats y respuestas</td><td>Prestación del servicio de emparejamiento</td></tr>
</table>

<h3>b. Información que recopilamos automáticamente</h3>
<table><tr><th>Tipo de dato</th><th>Finalidad</th></tr>
<tr><td>Ubicación GPS (con consentimiento)</td><td>Emparejamiento por cercanía</td></tr>
<tr><td>Datos de uso (solicitudes, respuestas, calificaciones)</td><td>Mejorar el algoritmo y reputación</td></tr>
<tr><td>Dirección IP, dispositivo, sistema operativo</td><td>Seguridad y diagnóstico técnico</td></tr>
<tr><td>Tokens de notificaciones push</td><td>Alertas sobre solicitudes y mensajes</td></tr>
</table>

<h2>2. CÓMO USAMOS TU INFORMACIÓN</h2>
<ul>
<li><strong>Prestar el servicio:</strong> Conectar clientes con vendedores compatibles.</li>
<li><strong>Verificar identidad y edad (LOPNNA):</strong> Solo mayores de 18 años.</li>
<li><strong>Geolocalización:</strong> Mostrar vendedores cercanos sin revelar tu dirección exacta.</li>
<li><strong>Notificaciones:</strong> Alertas push sobre solicitudes, respuestas y mensajes.</li>
<li><strong>Mejora del algoritmo:</strong> Datos anonimizados para optimización.</li>
<li><strong>Seguridad:</strong> Detectar actividades sospechosas y cuentas duplicadas.</li>
</ul>

<h2>3. UBICACIÓN EN TIEMPO REAL (GPS)</h2>
<p>NEXXOS <strong>solo accede a tu ubicación si das tu consentimiento explícito</strong>. Puedes revocar el permiso en cualquier momento desde los ajustes de tu dispositivo.</p>

<h2>4. VERIFICACIÓN FACIAL (SOLO VENDEDORES)</h2>
<p>La verificación facial se realiza a través de un proveedor tecnológico especializado. No almacenamos las imágenes originales en texto plano; se procesan de forma cifrada.</p>

<h2>5. COMPARTIR DATOS CON TERCEROS</h2>
<p>NEXXOS <strong>no vende ni alquila</strong> tus datos personales. Podemos compartir información con:</p>
<ul>
<li>Vendedores/clientes (información necesaria para el servicio)</li>
<li>Proveedores técnicos (hosting, notificaciones, verificación facial)</li>
<li>Autoridades judiciales venezolanas (por orden judicial)</li>
</ul>

<h2>6. SEGURIDAD</h2>
<p>Implementamos cifrado de datos sensibles, almacenamiento seguro, control de accesos y monitoreo de actividad sospechosa. Si detectas una vulnerabilidad, repórtala a <a href="mailto:seguridad@nexxos.app">seguridad@nexxos.app</a>.</p>

<h2>7. TUS DERECHOS</h2>
<table><tr><th>Derecho</th><th>Explicación</th></tr>
<tr><td>Acceso</td><td>Saber qué datos tenemos sobre ti</td></tr>
<tr><td>Rectificación</td><td>Corregir datos inexactos desde "Editar Perfil"</td></tr>
<tr><td>Supresión</td><td>Solicitar la eliminación de tus datos</td></tr>
<tr><td>Oposición</td><td>Oponerte al uso de tus datos para fines específicos</td></tr>
<tr><td>Portabilidad</td><td>Recibir tus datos en formato estructurado</td></tr>
</table>
<p>Para ejercer tus derechos: <a href="mailto:privacidad@nexxos.app">privacidad@nexxos.app</a></p>

<h2>8. RETENCIÓN DE DATOS</h2>
<p>Conservamos tus datos mientras tu cuenta esté activa. Una vez cerrada, eliminamos o anonimizamos tus datos dentro de los <strong>90 días siguientes</strong>.</p>

<h2>9. MENORES DE EDAD (LOPNNA)</h2>
<p>NEXXOS <strong>NO está dirigido a menores de 18 años</strong>. Si tenemos conocimiento de un menor registrado, eliminaremos su cuenta de inmediato.</p>

<h2>10. TRANSFERENCIA INTERNACIONAL</h2>
<p>Algunos proveedores de servicios pueden estar ubicados en otros países. Al aceptar esta Política, consientes esta transferencia.</p>

<h2>11. CAMBIOS EN ESTA POLÍTICA</h2>
<p>Te notificaremos con al menos <strong>10 días de anticipación</strong> sobre cambios sustanciales.</p>

<h2>12. CONTACTO</h2>
<ul>
<li><strong>Privacidad:</strong> <a href="mailto:privacidad@nexxos.app">privacidad@nexxos.app</a></li>
<li><strong>Legal:</strong> <a href="mailto:legal@nexxos.app">legal@nexxos.app</a></li>
<li><strong>Soporte:</strong> <a href="mailto:soporte@nexxos.app">soporte@nexxos.app</a></li>
</ul>`;
const SOBRE_NOSOTROS_CONTENT = `<h2>🚀 Misión</h2>
<p>Conectar clientes que necesitan productos o servicios con proveedores locales mediante un sistema de emparejamiento inteligente, reduciendo tiempos de búsqueda y creando oportunidades de negocio para vendedores verificados.</p>

<h2>🌍 Visión</h2>
<p>Convertirnos en la principal plataforma de emparejamiento del país, donde cualquier persona pueda encontrar lo que necesita cerca de su ubicación, y cualquier negocio pueda crecer a través de la tecnología.</p>

<h2>💎 Valores</h2>
<ul>
<li><strong>Confianza:</strong> Verificamos la identidad de los vendedores para que los clientes se sientan seguros.</li>
<li><strong>Eficiencia:</strong> Reducimos el tiempo de respuesta y la incertidumbre.</li>
<li><strong>Innovación:</strong> Mejoramos constantemente con base en las necesidades reales de los usuarios.</li>
<li><strong>Transparencia:</strong> Operamos bajo términos claros y políticas de privacidad robustas.</li>
</ul>

<h2>📖 Historia</h2>
<p>NEXXOS nació de una necesidad real en Venezuela: encontrar un repuesto para tu carro cerca de ti sin tener que llamar a decenas de lugares, recorrer la ciudad o depender de grupos de WhatsApp desordenados.</p>
<p>Lo que comenzó como una solución para el sector automotriz, se convirtió en una <strong>plataforma de emparejamiento multisectorial</strong>: un ecosistema donde clientes y proveedores se encuentran de forma inteligente.</p>

<h2>👥 Equipo</h2>
<p>NEXXOS fue fundada por un equipo multidisciplinario de emprendedores, desarrolladores y especialistas en logística con amplia experiencia en el mercado venezolano. Creemos en el poder de la tecnología para generar oportunidades reales.</p>

<h2>📬 Contacto</h2>
<ul>
<li>📧 <a href="mailto:soporte@nexxos.app">soporte@nexxos.app</a></li>
<li>📧 <a href="mailto:legal@nexxos.app">legal@nexxos.app</a></li>
<li>📧 <a href="mailto:privacidad@nexxos.app">privacidad@nexxos.app</a></li>
<li>📧 <a href="mailto:alianzas@nexxos.app">alianzas@nexxos.app</a></li>
</ul>

<h2>📱 Redes Sociales</h2>
<ul>
<li>📷 Instagram: <a href="https://instagram.com/Nexxos.app">@Nexxos.app</a></li>
<li>🎵 TikTok: <a href="https://tiktok.com/@Nexxos.app">@Nexxos.app</a></li>
<li>📘 Facebook: <a href="https://facebook.com/NexxosApp">Nexxos App</a></li>
</ul>`;
async function main() {
    console.log('Seeding legal documents...');
    const docs = [
        { key: 'terminos', title: 'Términos y Condiciones', content: TERMINOS_CONTENT },
        { key: 'privacidad', title: 'Política de Privacidad', content: PRIVACIDAD_CONTENT },
        { key: 'sobre-nosotros', title: 'Sobre Nosotros', content: SOBRE_NOSOTROS_CONTENT },
    ];
    for (const doc of docs) {
        await prisma.legalDocument.upsert({
            where: { key: doc.key },
            update: {},
            create: doc,
        });
        console.log(`  ✅ ${doc.key}: ${doc.title}`);
    }
    console.log('Legal documents seeded successfully!');
}
main()
    .catch((e) => { console.error('Seed error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed-legal.js.map