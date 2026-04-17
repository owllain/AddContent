import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function seedDatabase() {
  // Check if admin already exists
  const adminExists = await db.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminExists) {
    console.log('Admin user already exists, skipping seed');
    return;
  }

  const adminPassword = await hashPassword('admin123');

  // Create admin user
  const admin = await db.user.create({
    data: {
      email: 'admin@intranet.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create editor user
  const editorPassword = await hashPassword('editor123');
  const editor = await db.user.create({
    data: {
      email: 'editor@intranet.com',
      name: 'Editor de Contenido',
      password: editorPassword,
      role: 'EDITOR',
    },
  });

  // Create root node: Tarjetas de Crédito
  const tarjetas = await db.node.create({
    data: {
      title: 'Tarjetas de Crédito',
      slug: 'tarjetas-de-credito',
      content: `<h2>Tarjetas de Crédito</h2><p>Bienvenido al centro de información sobre tarjetas de crédito. Aquí encontrará toda la información necesaria sobre productos, procesos y políticas relacionadas con nuestras tarjetas.</p><div class="mc-highlight-box"><strong>Nota importante:</strong> Esta sección es actualizada regularmente por el equipo de producto.</div>`,
      icon: 'CreditCard',
      order: 0,
      published: true,
      authorId: admin.id,
    },
  });

  // Create children of Tarjetas
  const bloqueo = await db.node.create({
    data: {
      title: 'Bloqueo de Tarjetas',
      slug: 'bloqueo-de-tarjetas',
      content: `<h2>Bloqueo de Tarjetas</h2><h3>¿Cómo bloquear una tarjeta?</h3><p>Siga estos pasos para bloquear su tarjeta de crédito de manera temporal o permanente:</p><ol><li>Acceda a su cuenta en línea o llame al centro de atención</li><li>Seleccione la tarjeta que desea bloquear</li><li>Elija el tipo de bloqueo: temporal o permanente</li><li>Confirme la operación</li></ol><div class="mc-info-box"><strong>Bloqueo temporal:</strong> Su tarjeta será desactivada por 30 días. Puede reactivarla en cualquier momento desde su cuenta.</div><h3>Motivos comunes de bloqueo</h3><ul><li>Pérdida o robo de la tarjeta</li><li>Detección de transacciones sospechosas</li><li>Solicitud del titular por seguridad</li><li>Renovación en trámite</li></ul><h3>Tiempos de atención</h3><table><thead><tr><th>Canal</th><th>Tiempo estimado</th><th>Disponibilidad</th></tr></thead><tbody><tr><td>Línea telefónica</td><td>Inmediato</td><td>24/7</td></tr><tr><td>App móvil</td><td>Inmediato</td><td>24/7</td></tr><tr><td>Sucursal</td><td>15-30 min</td><td>L-V 8am-5pm</td></tr></tbody></table>`,
      icon: 'ShieldOff',
      order: 0,
      published: true,
      parentId: tarjetas.id,
      authorId: admin.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Renovación de Tarjetas',
      slug: 'renovacion-de-tarjetas',
      content: `<h2>Renovación de Tarjetas</h2><p>El proceso de renovación de tarjetas de crédito se realiza automáticamente antes de la fecha de vencimiento.</p><h3>Proceso de renovación</h3><p>Nuestras tarjetas se renuevan de forma automática en los siguientes casos:</p><ul><li>Vencimiento de la tarjeta física (cada 3-5 años)</li><li>Deterioro visible del plástico</li><li>Cambio de tecnología de chip</li><li>Actualización de diseño corporativo</li></ul><div class="mc-highlight-box"><strong>Cronograma de envío:</strong> La nueva tarjeta se envía entre 30 y 15 días antes del vencimiento de la actual.</div><h3>¿Qué hacer al recibir su nueva tarjeta?</h3><ol><li>Verifique que los datos sean correctos</li><li>Firme el reverso de la tarjeta</li><li>Active la tarjeta mediante la app o línea telefónica</li><li>Destruya la tarjeta anterior cortándola diagonalmente</li></ol>`,
      icon: 'RefreshCw',
      order: 1,
      published: true,
      parentId: tarjetas.id,
      authorId: editor.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Categorías de Tarjetas',
      slug: 'categorias-de-tarjetas',
      content: `<h2>Categorías de Tarjetas</h2><p>Ofrecemos una amplia variedad de tarjetas de crédito diseñadas para diferentes perfiles y necesidades.</p><div class="mc-card"><h3>Tarjeta Clásica</h3><p>Ideal para quienes inician su vida crediticia. Incluye beneficios básicos y sin anualidad el primer año.</p></div><div class="mc-card"><h3>Tarjeta Oro</h3><p>Para clientes con historial crediticio consolidado. Incluye seguros de viaje y acceso a salas VIP.</p></div><div class="mc-card"><h3>Tarjeta Platinum</h3><p>Nuestro producto premium con beneficios exclusivos: asistencia personalizada, seguros ampliados y programas de puntos con mejor rendimiento.</p></div><h3>Comparativo de beneficios</h3><table><thead><tr><th>Beneficio</th><th>Clásica</th><th>Oro</th><th>Platinum</th></tr></thead><tbody><tr><td>Anualidad</td><td>$0 (1er año)</td><td>$500</td><td>$1,200</td></tr><tr><td>Seguro de viaje</td><td>No</td><td>Básico</td><td>Premium</td></tr><tr><td>Salas VIP</td><td>No</td><td>2/año</td><td>Ilimitado</td></tr><tr><td>Puntos por dólar</td><td>1x</td><td>2x</td><td>3x</td></tr></tbody></table>`,
      icon: 'Layers',
      order: 2,
      published: true,
      parentId: tarjetas.id,
      authorId: editor.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Tasas de Interés',
      slug: 'tasas-de-interes',
      content: `<h2>Tasas de Interés</h2><p>Las tasas de interés de nuestras tarjetas de crédito se calculan de forma transparente y competitiva.</p><h3>Tasas vigentes</h3><table><thead><tr><th>Concepto</th><th>Tasa</th></tr></thead><tbody><tr><td>Tasa anual ordinaria</td><td>25.5% EA</td></tr><tr><td>Tasa anual moratoria</td><td>35.0% EA</td></tr><tr><td>Interés de financiamiento mensual</td><td>1.92% MV</td></tr><tr><td>Cuota de manejo mensual</td><td>$8,500 COP</td></tr><tr><td>Retiro en cajero</td><td>4.5% + $5,000</td></tr></tbody></table><div class="mc-info-box"><strong>EA = Efectiva Anual | MV = Mensual Vencida</strong><br/>Las tasas pueden variar según el perfil crediticio del cliente y las condiciones del mercado.</div><h3>¿Cómo se calcula el interés?</h3><p>El interés se calcula diariamente sobre el saldo pendiente de pago:</p><blockquote>Tasa diaria = Tasa Anual / 365<br/>Interés mensual = Saldo pendiente × Tasa diaria × Días del periodo</blockquote>`,
      icon: 'Percent',
      order: 3,
      published: true,
      parentId: tarjetas.id,
      authorId: admin.id,
    },
  });

  // Create another root: Préstamos
  const prestamos = await db.node.create({
    data: {
      title: 'Préstamos',
      slug: 'prestamos',
      content: `<h2>Préstamos</h2><p>Centro de información sobre nuestras líneas de crédito y préstamos.</p><div class="mc-highlight-box"><strong>Oferta especial:</strong> Tasas preferenciales para empleados corporativos. Consulte con su departamento de RRHH.</div>`,
      icon: 'Banknote',
      order: 1,
      published: true,
      authorId: admin.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Préstamos Personales',
      slug: 'prestamos-personales',
      content: `<h2>Préstamos Personales</h2><p>Nuestros préstamos personales ofrecen tasas competitivas y plazos flexibles para cubrir sus necesidades.</p><h3>Características</h3><ul><li>Monto: desde $1,000,000 hasta $100,000,000</li><li>Plazo: 12 a 60 meses</li><li>Tasa desde: 16.5% EA</li><li>Aprobación: 24-48 horas hábiles</li></ul>`,
      icon: 'Wallet',
      order: 0,
      published: true,
      parentId: prestamos.id,
      authorId: editor.id,
    },
  });

  // Create another root: Procesos Internos
  const procesos = await db.node.create({
    data: {
      title: 'Procesos Internos',
      slug: 'procesos-internos',
      content: `<h2>Procesos Internos</h2><p>Guías y documentación para los procesos operativos internos de la organización.</p>`,
      icon: 'Briefcase',
      order: 2,
      published: true,
      authorId: admin.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Onboarding de Empleados',
      slug: 'onboarding-empleados',
      content: `<h2>Onboarding de Empleados</h2><p>Bienvenido al proceso de incorporación. Aquí encontrará todo lo que necesita para su primer día y las primeras semanas.</p><h3>Checklist de primer día</h3><ul><li>Presentarse en recepción con documento de identidad</li><li>Recibir credencial de acceso</li><li>Configurar cuenta de correo y herramientas digitales</li><li>Revisión de políticas de seguridad de la información</li><li>Tour por las instalaciones</li></ul><div class="mc-info-box"><strong>¿Tiene dudas?</strong> Contacte al equipo de RRHH al extensión 5010 o por correo a rrhh@empresa.com</div>`,
      icon: 'UserPlus',
      order: 0,
      published: true,
      parentId: procesos.id,
      authorId: editor.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Políticas de Seguridad',
      slug: 'politicas-seguridad',
      content: `<h2>Políticas de Seguridad de la Información</h2><p>Documento que establece las normas y procedimientos para garantizar la seguridad de la información corporativa.</p><h3>Clasificación de información</h3><ul><li><strong>Pública:</strong> Información que puede ser compartida sin restricciones</li><li><strong>Interna:</strong> Información para uso exclusivo de empleados</li><li><strong>Confidencial:</strong> Información restringida a áreas específicas</li><li><strong>Crítica:</strong> Información cuyo acceso está limitado a personal autorizado</li></ul>`,
      icon: 'Lock',
      order: 1,
      published: true,
      parentId: procesos.id,
      authorId: admin.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@intranet.com / admin123');
  console.log('📧 Editor: editor@intranet.com / editor123');
}
