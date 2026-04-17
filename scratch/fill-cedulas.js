const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ where: { cedula: null }});
  for (let u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { cedula: `ID-${Math.floor(Math.random() * 100000)}` }
    });
  }
  console.log('Done');
}
run();
