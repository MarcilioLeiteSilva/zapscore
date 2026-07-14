import 'dotenv/config';
import cron from 'node-cron';
import { IdMapper }      from './id-mapper';
import { syncBootstrap } from './jobs/sync-bootstrap';
import { syncLive }      from './jobs/sync-live';
import { syncToday }     from './jobs/sync-today';
import { syncStandings } from './jobs/sync-standings';

console.log('🚀 sync-supabase-brasileirao iniciado');
console.log(`   ZapScore API : ${process.env.ZAPSCORE_API_URL}`);
console.log(`   Supabase URL : ${process.env.SUPABASE_URL}`);
console.log(`   Liga         : Brasileirão Série A (${process.env.BRASILEIRAO_LEAGUE_ID})`);
console.log(`   Temporada    : ${process.env.SEASON}`);
console.log('');

// ── Sync ao vivo — a cada 1 minuto ───────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  await syncLive().catch(err => console.error('[CRON live]', err.message));
});

// ── Sync do dia — a cada 30 minutos ──────────────────────────────────────────
cron.schedule('*/30 * * * *', async () => {
  await syncToday().catch(err => console.error('[CRON today]', err.message));
});

// ── Sync de classificação — a cada 6 horas ────────────────────────────────────
cron.schedule('0 */6 * * *', async () => {
  await syncStandings().catch(err => console.error('[CRON standings]', err.message));
});

// ── Bootstrap (liga + times) — diário às 01:00 ───────────────────────────────
cron.schedule('0 1 * * *', async () => {
  // Recarrega o IdMapper antes do bootstrap para garantir consistência
  await IdMapper.initialize().catch(err => console.error('[CRON IdMapper init]', err.message));
  await syncBootstrap().catch(err => console.error('[CRON bootstrap]', err.message));
});

// ── Execução inicial na ordem correta: ID mapper → liga → times → matches → standings ────
(async () => {
  console.log('▶ Inicializando mapeamento de IDs e executando sync inicial...');

  try {
    // 0. Inicializa mapeamento de IDs existentes no Supabase
    await IdMapper.initialize();

    // 1. Liga e Times primeiro (respeitar FKs)
    await syncBootstrap();
    
    // Após rodar o bootstrap, reinicializa o mapper para pegar os IDs novos (se houver)
    await IdMapper.initialize();

    // 2. Partidas do dia
    await syncToday();

    // 3. Classificação (depende de teams já existirem)
    await syncStandings();

    console.log('✅ Sync inicial concluído. Crons ativos.');
  } catch (err: any) {
    console.error('❌ Erro crítico no startup do sync:', err.message);
  }
})();
