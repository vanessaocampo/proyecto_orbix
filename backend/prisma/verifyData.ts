import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { categoria: true, proveedor: true }
  });
  console.log('--- ULTIMOS PRODUCTOS ---');
  console.dir(productos, { depth: null });
  
  const movimientos = await prisma.inventarioMovimiento.findMany({
    orderBy: { fecha: 'desc' },
    take: 5,
    include: { producto: true, usuario: true }
  });
  console.log('\n--- ULTIMOS MOVIMIENTOS ---');
  console.dir(movimientos, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());