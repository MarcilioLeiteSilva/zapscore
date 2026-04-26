import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checando datas no banco de dados...');
    try {
        const fixtures = await prisma.fixture.findMany({
            where: { league: { externalId: 71 } },
            orderBy: { date: 'asc' },
            take: 5,
            include: { homeTeam: true, awayTeam: true }
        });

        for (const f of fixtures) {
            console.log(`\n⚽ Jogo: ${f.homeTeam.name} vs ${f.awayTeam.name}`);
            console.log(`📅 Data no Banco (UTC): ${f.date.toISOString()}`);
            console.log(`⏰ Horário formatado (BRT): ${f.date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        }
    } catch (e) {
        console.error('❌ Erro:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
