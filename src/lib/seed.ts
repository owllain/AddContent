import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function seedDatabase() {
  // 1. Crear las tablas si no existen en Turso
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "cedula" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'VIEWER',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_cedula_key" ON "User"("cedula");
  `);
  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Node" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "content" TEXT NOT NULL DEFAULT '',
      "icon" TEXT NOT NULL DEFAULT 'FileText',
      "order" INTEGER NOT NULL DEFAULT 0,
      "parentId" TEXT,
      "published" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "authorId" TEXT,
      CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Node_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Node_slug_key" ON "Node"("slug");
  `);

  // 2. Insertar usuarios iniciales
  const adminPassword = await hashPassword('admin123');
  const editorPassword = await hashPassword('editor123');

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

  // 3. Insertar contenido base si no existe
  const nodeCount = await db.node.count();
  if (nodeCount > 0) {
    console.log('Content already exists, skipping node seed');
    return;
  }

  const tarjetas = await db.node.create({
    data: {
      title: 'Tarjetas de Crédito',
      slug: 'tarjetas-de-credito',
      content: `<h2>Tarjetas de Crédito</h2><p>Bienvenido al centro de información sobre tarjetas de crédito.</p>`,
      icon: 'CreditCard',
      order: 0,
      published: true,
      authorId: admin.id,
    },
  });

  await db.node.create({
    data: {
      title: 'Bloqueo de Tarjetas',
      slug: 'bloqueo-de-tarjetas',
      content: `<h2>Bloqueo de Tarjetas</h2><p>Guía para bloqueo de tarjetas.</p>`,
      icon: 'ShieldOff',
      order: 0,
      published: true,
      parentId: tarjetas.id,
      authorId: admin.id,
    },
  });

  console.log('✅ Database seeded and tables created successfully!');
}
