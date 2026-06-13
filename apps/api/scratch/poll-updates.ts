import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
const FIXTURE_ID = '4cf2cb03-7812-4eb0-b81d-c523b4a3bf2b';
const ITERATIONS = 4;
const INTERVAL_MS = 60000; // 60 segundos

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchMatchState() {
  const res = await axios.get(`${API_BASE}/fixtures/${FIXTURE_ID}`);
  return res.data;
}

async function main() {
  console.log(`Iniciando monitoramento do jogo Catar x Suíça (ID: ${FIXTURE_ID})`);
  console.log(`Faremos ${ITERATIONS} consultas com intervalo de ${INTERVAL_MS / 1000} segundos para validar a atualização minuto a minuto.`);

  let lastElapsed: number | null = null;
  let lastScore = '';
  let lastEventsCount = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] Consulta ${i + 1}/${ITERATIONS}...`);

    try {
      const match = await fetchMatchState();
      
      const homeName = match.homeTeam?.name || 'Qatar';
      const awayName = match.awayTeam?.name || 'Switzerland';
      const homeGoals = match.homeGoals ?? 0;
      const awayGoals = match.awayGoals ?? 0;
      const elapsed = match.elapsed ?? 0;
      const statusShort = match.statusShort || '1H';
      const score = `${homeGoals} - ${awayGoals}`;
      const eventsCount = match.events?.length || 0;

      console.log(`Estado Atual: ${homeName} ${score} ${awayName} | Tempo: ${elapsed}' (Status: ${statusShort})`);
      console.log(`Eventos registrados: ${eventsCount}`);

      if (lastElapsed !== null) {
        // Verificar se o tempo decorrido aumentou ou o placar mudou
        const elapsedDiff = elapsed - lastElapsed;
        if (elapsedDiff > 0) {
          console.log(`✅ O tempo do jogo avançou de ${lastElapsed}' para ${elapsed}' (+${elapsedDiff} min)`);
        } else if (elapsedDiff === 0) {
          console.log(`⚠️ O tempo não avançou na API desde a última consulta (${elapsed}')`);
        } else {
          console.log(`⚠️ O tempo diminuiu ou reiniciou (de ${lastElapsed}' para ${elapsed}')`);
        }

        if (score !== lastScore) {
          console.log(`⚽ ALTERAÇÃO DE PLACAR! Placar mudou de ${lastScore} para ${score}`);
        }

        if (eventsCount > lastEventsCount) {
          console.log(`🔥 NOVOS EVENTOS DETECTADOS! (${eventsCount - lastEventsCount} novo(s) evento(s))`);
          // Mostrar os novos eventos
          const newEvents = match.events.slice(lastEventsCount);
          newEvents.forEach((ev: any) => {
            console.log(`  - [${ev.time}'] [${ev.type} - ${ev.detail}] ${ev.player}`);
          });
        }
      }

      // Atualizar últimas referências
      lastElapsed = elapsed;
      lastScore = score;
      lastEventsCount = eventsCount;

    } catch (err) {
      console.error(`❌ Erro ao consultar a API: ${err.message}`);
    }

    if (i < ITERATIONS - 1) {
      console.log(`Aguardando ${INTERVAL_MS / 1000} segundos até a próxima consulta...`);
      await sleep(INTERVAL_MS);
    }
  }

  console.log('\nMonitoramento finalizado.');
}

main();
