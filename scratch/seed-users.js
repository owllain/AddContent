const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const SALT_ROUNDS = 12;
  
  const users = [
    { name: 'Admin User', email: 'admin@intranet.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Editor User', email: 'editor@intranet.com', password: 'editor123', role: 'EDITOR' },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
    console.log(`Verificando usuario: ${u.email}`);
    
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, role: u.role },
      create: { 
        name: u.name, 
        email: u.email, 
        password: hashedPassword, 
        role: u.role 
      },
    });
    console.log(`Usuario ${u.email} listo.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
