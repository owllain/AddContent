import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function seedDatabase() {
  const adminPassword = await hashPassword('admin123');
  const editorPassword = await hashPassword('editor123');

  // Upsert admin user
  const admin = await db.user.upsert({
    where: { email: 'admin@addcontent.com' },
    update: {
      password: adminPassword,
      cedula: '100000001',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@addcontent.com',
      name: 'Administrador',
      cedula: '100000001',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Upsert editor user
  const editor = await db.user.upsert({
    where: { email: 'editor@addcontent.com' },
    update: {
      password: editorPassword,
      cedula: '100000002',
      role: 'EDITOR',
    },
    create: {
      email: 'editor@addcontent.com',
      name: 'Editor de Contenido',
      cedula: '100000002',
      password: editorPassword,
      role: 'EDITOR',
    },
  });

  // Check if content already exists to avoid duplication in nodes
  const nodeCount = await db.node.count();
  if (nodeCount > 0) {
    console.log('Content already exists, skipping node seed');
    return;
  }

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
  await db.node.create({
    data: {
      title: 'Bloqueo de Tarjetas',
      slug: 'bloqueo-de-tarjetas',
      content: `<h2>Bloqueo de Tarjetas</h2><h3>¿Cómo bloquear una tarjeta?</h3><p>Siga estos pasos para bloquear su tarjeta de crédito de manera temporal o permanente:</p><ol><li>Acceda a su cuenta en línea o llame al centro de atención</li><li>Seleccione la tarjeta que desea bloquear</li><li>Elija el tipo de bloqueo: temporal o permanente</li><li>Confirme la operación</li></ol><div class="mc-info-box"><strong>Bloqueo temporal:</strong> Su tarjeta será desactivada por 30 días. Puede reactivarla en cualquier momento desde su cuenta.</div><h3>Motivos comunes de bloqueo</h3><ul><li>Pérdida o robo de la tarjeta</li><li>Detección de transacciones sospechosas</li><li>Solicitud del titular por seguridad</li><li>Renovación en trámite</li></ul>`,
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
      content: `<h2>Renovación de Tarjetas</h2><p>El proceso de renovación de tarjetas de crédito se realiza automáticamente antes de la fecha de vencimiento.</p><h3>Proceso de renovación</h3><ul><li>Vencimiento de la tarjeta física (cada 3-5 años)</li><li>Deterioro visible del plástico</li><li>Cambio de tecnología de chip</li></ul>`,
      icon: 'RefreshCw',
      order: 1,
      published: true,
      parentId: tarjetas.id,
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
      content: `<h2>Onboarding de Empleados</h2><p>Bienvenido al proceso de incorporación. Aquí encontrará todo lo que necesita para su primer día y las primeras semanas.</p>`,
      icon: 'UserPlus',
      order: 0,
      published: true,
      parentId: procesos.id,
      authorId: editor.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@addcontent.com / admin123 (Cédula: 100000001)');
  console.log('📧 Editor: editor@addcontent.com / editor123 (Cédula: 100000002)');
}
