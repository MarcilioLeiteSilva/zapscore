import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.league.count();
        console.log(`✅ Conexão OK. Ligas no banco: ${count}`);
    } catch (e) {
        console.error('❌ Erro de conexão:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
