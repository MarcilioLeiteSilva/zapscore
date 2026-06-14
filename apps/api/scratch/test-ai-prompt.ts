import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AiService } from '../src/fixtures/ai-analysis/ai.service';

async function main() {
  console.log('Iniciando contexto de teste isolado para o AiService...');
  
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/api/.env' })],
    providers: [AiService],
  }).compile();

  const aiService = moduleRef.get(AiService);

  const sampleMatchData = {
    competition: "Copa do Nordeste",
    round: "Rodada 5",
    date: new Date().toISOString(),
    venue: "Castelão, Fortaleza",
    teams: {
      home: {
        name: "Fortaleza",
        standingRank: 2,
        standingPoints: 12,
        formRecent: ["V", "E", "V", "D", "V"],
        stats: {
          played: 5,
          wins: 3,
          draws: 1,
          losses: 1,
          goalsScoredAvg: 2.0,
          goalsConcededAvg: 0.8,
          cleanSheets: 2,
          failedToScore: 0
        }
      },
      away: {
        name: "Ceará",
        standingRank: 4,
        standingPoints: 9,
        formRecent: ["V", "V", "D", "E", "D"],
        stats: {
          played: 5,
          wins: 2,
          draws: 3,
          losses: 0,
          goalsScoredAvg: 1.2,
          goalsConcededAvg: 0.6,
          cleanSheets: 3,
          failedToScore: 1
        }
      }
    },
    headToHead: [
      { date: "2026-03-01", homeTeam: "Ceará", awayTeam: "Fortaleza", score: "1-1" }
    ],
    lineups: {
      homeStartingXI: ["Lucero (F)", "Pikachu (M)", "Tinga (D)"],
      awayStartingXI: ["Erick (F)", "Jean Carlos (M)", "Luiz Otávio (D)"]
    }
  };

  console.log('\nEnviando dados fictícios para análise da IA...');
  try {
    const analysis = await aiService.generateMatchAnalysis(sampleMatchData, true);
    console.log('\n✅ Retorno da IA recebido com SUCESSO e validado!');
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('\n❌ Falha na geração da análise de IA:', error.message);
  } finally {
    await moduleRef.close();
  }
}

main();
