import { EcosystemApp } from './apps-catalog';

export interface ASOPayload {
  appId: string;
  packageName: string;
  title: string; // Max 30 chars (Google Play Store limit)
  shortDescription: string; // Max 80 chars (Google Play Store limit)
  fullDescription: string; // Max 4000 chars
  releaseNotes: string; // Max 500 chars (What's New in this release)
  keywords: string[];
  titleCharCount: number;
  shortDescCharCount: number;
  fullDescCharCount: number;
  generatedBy: 'template' | 'gemini';
}

/**
 * Corta com segurança uma string para não ultrapassar o limite de caracteres da Google Play.
 */
function truncateSafely(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const sliced = str.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
}

/**
 * Gera os textos de ASO otimizados para a Google Play Store
 */
export function generateLocalASO(app: EcosystemApp): ASOPayload {
  // 1. Título do App (Rigorosamente até 30 caracteres)
  let rawTitle = `${app.shortName} Ao Vivo - ZapScore`;
  if (rawTitle.length > 30) {
    rawTitle = `${app.shortName} - ZapScore`;
  }
  if (rawTitle.length > 30) {
    rawTitle = truncateSafely(`${app.shortName} Placar`, 30);
  }
  const title = rawTitle.slice(0, 30);

  // 2. Descrição Curta (Rigorosamente até 80 caracteres)
  const rawShortDesc = `Placar ao vivo do ${app.shortName}, tabela, gols em tempo real e escalações!`;
  const shortDescription = truncateSafely(rawShortDesc, 80);

  // 3. Descrição Completa (Até 4000 caracteres)
  const featuresList = app.features.map((f) => `⚡ ${f}`).join('\n');
  const keywordsList = app.defaultKeywords.join(', ');

  const fullDescription = `Acompanhe tudo sobre o ${app.leagueName} com a melhor e mais rápida experiência em futebol ao vivo no seu celular!

Com o ${app.name}, você recebe notificações instantâneas de gols, acompanha a tabela atualizada em tempo real, confere escalações oficiais antes de todo mundo e fica por dentro de todos os lances, vídeos e notícias.

🚀 PRINCIPAIS RECURSOS:
${featuresList}

🔔 NOTIFICAÇÕES INSTANTÂNEAS DE GOL
Não perca nenhum lance do seu time do coração! Nossos alertas push disparam no mesmo instante em que a bola balança a rede, com som customizado e detalhes de quem marcou.

📊 TABELA COMPLETA E CLASSIFICAÇÃO AO VIVO
Veja a posição do seu clube em tempo real, saldo de gols, pontuação, aproveitamento e simulações imediatas da rodada.

👥 ESCALAÇÕES OFICIAIS ANTECIPADAS
Descubra quem vai a campo até 50 a 60 minutos antes da bola rolar! Titulares, reservas, esquema tático e comissão técnica.

🎥 MELHORES MOMENTOS EM VÍDEO & NOTÍCIAS
Assista aos gols da rodada, melhores lances e acesse a central de notícias com cobertura diária exclusiva dos clubes participantes.

🛡️ LEVE, RÁPIDO E ECONÔMICO
Aplicativo super otimizado que não consome sua franquia de dados e consome o mínimo de bateria, garantindo estabilidade máxima em dias de jogos decisivos.

Baixe agora o ${app.name} e tenha a paixão pelo futebol na palma da sua mão!

---
Termos e Políticas:
${app.privacyPolicyUrl}
Suporte e Contato: ${app.supportEmail}
Tags de busca: ${keywordsList}`;

  // 4. Notas da Versão (Até 500 caracteres)
  const releaseNotes = `🎉 Lançamento oficial do ${app.name} 2026!
• Placar ao vivo de alta velocidade com alertas instantâneos de gols
• Tabela completa e chaveamento atualizado em tempo real
• Escalações oficiais antecipadas e estatísticas detalhadas
• Central de vídeos com os melhores momentos das partidas
• Desempenho ultra rápido e baixo consumo de bateria!`;

  return {
    appId: app.id,
    packageName: app.packageName,
    title,
    shortDescription,
    fullDescription: fullDescription.slice(0, 4000),
    releaseNotes: releaseNotes.slice(0, 500),
    keywords: app.defaultKeywords,
    titleCharCount: title.length,
    shortDescCharCount: shortDescription.length,
    fullDescCharCount: fullDescription.length,
    generatedBy: 'template'
  };
}

/**
 * Tenta enriquecer o ASO via Gemini se a chave de API estiver configurada no ambiente
 */
export async function generateASOWithAI(app: EcosystemApp): Promise<ASOPayload> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

  if (!apiKey) {
    return generateLocalASO(app);
  }

  try {
    const prompt = `Você é um especialista mundial em ASO (App Store Optimization) para a Google Play Store.
Crie o conteúdo de ASO para o aplicativo: "${app.name}" (${app.leagueName}).
Público-alvo: Torcedores de futebol apaixonados, 16+ anos.

REGRAS RÍGIDAS DE CONTAGEM DE CARACTERES:
1. "title": Máximo estrito de 30 caracteres. Exemplos: "${app.shortName} Ao Vivo - ZapScore" ou "${app.shortName} Placar ZapScore".
2. "shortDescription": Máximo estrito de 80 caracteres. Deve ser impactante e conter palavra-chave de placar ao vivo e gols.
3. "fullDescription": Entre 1500 e 3500 caracteres (máximo 4000). Formate com emojis, seções claras de recursos, tópicos de escalação, tabela, vídeos e política de privacidade.
4. "releaseNotes": Máximo estrito de 500 caracteres (Notas da versão).
5. "keywords": Array com 8 a 12 palavras-chave relevantes.

Responda APENAS um JSON válido no formato:
{
  "title": "string (max 30 chars)",
  "shortDescription": "string (max 80 chars)",
  "fullDescription": "string (max 4000 chars)",
  "releaseNotes": "string (max 500 chars)",
  "keywords": ["tag1", "tag2"]
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      return generateLocalASO(app);
    }

    const data = await res.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return generateLocalASO(app);
    }

    const parsed = JSON.parse(rawContent);

    const title = (parsed.title || `${app.shortName} - ZapScore`).slice(0, 30);
    const shortDesc = (parsed.shortDescription || `Placar ao vivo do ${app.shortName}, gols e tabela em tempo real!`).slice(0, 80);
    const fullDesc = (parsed.fullDescription || '').slice(0, 4000);
    const releaseNotes = (parsed.releaseNotes || 'Novidades e melhorias na experiência de placar ao vivo.').slice(0, 500);

    return {
      appId: app.id,
      packageName: app.packageName,
      title,
      shortDescription: shortDesc,
      fullDescription: fullDesc.length > 500 ? fullDesc : generateLocalASO(app).fullDescription,
      releaseNotes,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : app.defaultKeywords,
      titleCharCount: title.length,
      shortDescCharCount: shortDesc.length,
      fullDescCharCount: fullDesc.length,
      generatedBy: 'gemini'
    };
  } catch (err) {
    console.error('Falha ao gerar ASO via Gemini, aplicando gerador local:', err);
    return generateLocalASO(app);
  }
}
