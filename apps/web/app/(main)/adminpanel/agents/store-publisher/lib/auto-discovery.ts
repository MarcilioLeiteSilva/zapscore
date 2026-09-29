import fs from 'fs';
import path from 'path';
import { ECOSYSTEM_APPS, EcosystemApp } from './apps-catalog';

const STATE_METADATA: Record<string, { name: string; region: EcosystemApp['region']; stateCode: string; primaryColor: string; secondaryColor: string; accentColor: string }> = {
  pernambucano: { name: 'Campeonato Pernambucano', region: 'Nordeste', stateCode: 'PE', primaryColor: '#DC2626', secondaryColor: '#991B1B', accentColor: '#FBBF24' },
  paraibano: { name: 'Campeonato Paraibano', region: 'Nordeste', stateCode: 'PB', primaryColor: '#059669', secondaryColor: '#064E3B', accentColor: '#EF4444' },
  maranhense: { name: 'Campeonato Maranhense', region: 'Nordeste', stateCode: 'MA', primaryColor: '#2563EB', secondaryColor: '#1E40AF', accentColor: '#F59E0B' },
  paulista: { name: 'Campeonato Paulista', region: 'Sudeste', stateCode: 'SP', primaryColor: '#E11D48', secondaryColor: '#9F1239', accentColor: '#FBBF24' },
  carioca: { name: 'Campeonato Carioca', region: 'Sudeste', stateCode: 'RJ', primaryColor: '#0284C7', secondaryColor: '#0369A1', accentColor: '#F97316' },
  mineiro: { name: 'Campeonato Mineiro', region: 'Sudeste', stateCode: 'MG', primaryColor: '#D97706', secondaryColor: '#B45309', accentColor: '#10B981' },
  gaucho: { name: 'Campeonato Gaúcho', region: 'Sul', stateCode: 'RS', primaryColor: '#0D9488', secondaryColor: '#115E59', accentColor: '#E11D48' },
  baiano: { name: 'Campeonato Baiano', region: 'Nordeste', stateCode: 'BA', primaryColor: '#059669', secondaryColor: '#047857', accentColor: '#EF4444' },
  cearense: { name: 'Campeonato Cearense', region: 'Nordeste', stateCode: 'CE', primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', accentColor: '#EF4444' },
  paranaense: { name: 'Campeonato Paranaense', region: 'Sul', stateCode: 'PR', primaryColor: '#10B981', secondaryColor: '#047857', accentColor: '#3B82F6' },
  catarinense: { name: 'Campeonato Catarinense', region: 'Sul', stateCode: 'SC', primaryColor: '#0284C7', secondaryColor: '#0369A1', accentColor: '#10B981' },
  goiano: { name: 'Campeonato Goiano', region: 'Sudeste', stateCode: 'GO', primaryColor: '#059669', secondaryColor: '#047857', accentColor: '#F59E0B' },
  alagoano: { name: 'Campeonato Alagoano', region: 'Nordeste', stateCode: 'AL', primaryColor: '#E11D48', secondaryColor: '#9F1239', accentColor: '#3B82F6' },
  sergipano: { name: 'Campeonato Sergipano', region: 'Nordeste', stateCode: 'SE', primaryColor: '#DC2626', secondaryColor: '#991B1B', accentColor: '#10B981' },
  potiguar: { name: 'Campeonato Potiguar', region: 'Nordeste', stateCode: 'RN', primaryColor: '#D97706', secondaryColor: '#B45309', accentColor: '#2563EB' },
  piaui: { name: 'Campeonato Piauiense', region: 'Nordeste', stateCode: 'PI', primaryColor: '#0D9488', secondaryColor: '#115E59', accentColor: '#F59E0B' },
  piauiense: { name: 'Campeonato Piauiense', region: 'Nordeste', stateCode: 'PI', primaryColor: '#0D9488', secondaryColor: '#115E59', accentColor: '#F59E0B' },
  capixaba: { name: 'Campeonato Capixaba', region: 'Sudeste', stateCode: 'ES', primaryColor: '#2563EB', secondaryColor: '#1E40AF', accentColor: '#E11D48' },
  brasiliense: { name: 'Campeonato Brasiliense', region: 'Sudeste', stateCode: 'DF', primaryColor: '#F59E0B', secondaryColor: '#B45309', accentColor: '#10B981' },
  matogrossense: { name: 'Campeonato Mato-Grossense', region: 'Sudeste', stateCode: 'MT', primaryColor: '#059669', secondaryColor: '#047857', accentColor: '#F59E0B' },
  sulmatogrossense: { name: 'Campeonato Sul-Mato-Grossense', region: 'Sul', stateCode: 'MS', primaryColor: '#0284C7', secondaryColor: '#0369A1', accentColor: '#FBBF24' },
  paraense: { name: 'Campeonato Paraense', region: 'Nacional', stateCode: 'PA', primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', accentColor: '#EF4444' },
  amazonense: { name: 'Campeonato Amazonense', region: 'Nacional', stateCode: 'AM', primaryColor: '#10B981', secondaryColor: '#047857', accentColor: '#F59E0B' },
  acreano: { name: 'Campeonato Acreano', region: 'Nacional', stateCode: 'AC', primaryColor: '#10B981', secondaryColor: '#047857', accentColor: '#EF4444' },
  amapaense: { name: 'Campeonato Amapaense', region: 'Nacional', stateCode: 'AP', primaryColor: '#0284C7', secondaryColor: '#0369A1', accentColor: '#FBBF24' },
  rondoniense: { name: 'Campeonato Rondoniense', region: 'Nacional', stateCode: 'RO', primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', accentColor: '#10B981' },
  roraimense: { name: 'Campeonato Roraimense', region: 'Nacional', stateCode: 'RR', primaryColor: '#059669', secondaryColor: '#047857', accentColor: '#F59E0B' },
  tocantinense: { name: 'Campeonato Tocantinense', region: 'Nacional', stateCode: 'TO', primaryColor: '#F59E0B', secondaryColor: '#B45309', accentColor: '#3B82F6' }
};

function getAppsBaseDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, '..'), // se estiver em apps/web -> d:\zapscore\apps
    path.resolve(cwd, 'apps'), // se estiver na raiz d:\zapscore -> d:\zapscore\apps
    'd:\\zapscore\\apps' // caminho absoluto canônico
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'estaduais'))) {
      return dir;
    }
  }

  return path.resolve(cwd, '..');
}

/**
 * Extrai dados do app_config.dart caso exista
 */
function parseAppConfigFile(filePath: string): { appName?: string; appSlug?: string; leagueId?: string } {
  if (!fs.existsSync(filePath)) return {};
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const nameMatch = content.match(/static\s+const\s+String\s+appName\s*=\s*['"]([^'"]+)['"]/);
    const slugMatch = content.match(/static\s+const\s+String\s+appSlug\s*=\s*['"]([^'"]+)['"]/);
    const leagueIdMatch = content.match(/static\s+const\s+(?:String|int)\s+(?:leagueId|externalLeagueId)\s*=\s*['"]?([0-9]+)['"]?/);

    return {
      appName: nameMatch ? nameMatch[1] : undefined,
      appSlug: slugMatch ? slugMatch[1] : undefined,
      leagueId: leagueIdMatch ? leagueIdMatch[1] : undefined
    };
  } catch {
    return {};
  }
}

/**
 * Extrai o applicationId do build.gradle.kts ou build.gradle
 */
function parseApplicationId(appDir: string): string | undefined {
  const gradleKts = path.join(appDir, 'android', 'app', 'build.gradle.kts');
  const gradle = path.join(appDir, 'android', 'app', 'build.gradle');

  if (fs.existsSync(gradleKts)) {
    try {
      const content = fs.readFileSync(gradleKts, 'utf-8');
      const match = content.match(/applicationId\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    } catch {}
  }

  if (fs.existsSync(gradle)) {
    try {
      const content = fs.readFileSync(gradle, 'utf-8');
      const match = content.match(/applicationId\s+["']([^"']+)["']/);
      if (match) return match[1];
    } catch {}
  }

  return undefined;
}

/**
 * Varre as pastas de apps em busca de novos apps clonados
 */
export function discoverClonedApps(): EcosystemApp[] {
  const appsDir = getAppsBaseDir();
  const searchFolders = ['estaduais', 'brasil', 'europa'];
  const discovered: EcosystemApp[] = [];

  const ignoredFolders = new Set(['icones', 'pb_hooks', 'relatorios', '.git', 'node_modules']);

  for (const folderName of searchFolders) {
    const targetPath = path.join(appsDir, folderName);
    if (!fs.existsSync(targetPath)) continue;

    try {
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name.toLowerCase();
        if (ignoredFolders.has(slug)) continue;

        const appFullPath = path.join(targetPath, entry.name);
        const pubspecPath = path.join(appFullPath, 'pubspec.yaml');

        // Confirma se é de fato um aplicativo Flutter
        if (!fs.existsSync(pubspecPath)) continue;

        // Se o app já está cadastrado estaticamente no catálogo, respeita a versão do catálogo
        if (ECOSYSTEM_APPS.some((a) => a.id === slug)) continue;

        // Extrai metadados do app
        const appConfig = parseAppConfigFile(path.join(appFullPath, 'lib', 'helpers', 'app_config.dart'));
        const pkgName = parseApplicationId(appFullPath) || `com.zapscore.estadual${slug}`;

        const stateInfo = STATE_METADATA[slug];
        const shortName = slug.charAt(0).toUpperCase() + slug.slice(1);
        const leagueName = stateInfo?.name || appConfig.appName || `Campeonato ${shortName}`;
        const region = stateInfo?.region || (folderName === 'europa' ? 'Internacional' : folderName === 'brasil' ? 'Nacional' : 'Nordeste');
        const primaryColor = stateInfo?.primaryColor || '#059669';
        const secondaryColor = stateInfo?.secondaryColor || '#064E3B';
        const accentColor = stateInfo?.accentColor || '#F59E0B';

        discovered.push({
          id: slug,
          name: `${shortName} ZapScore`,
          shortName,
          leagueName,
          packageName: pkgName,
          primaryColor,
          secondaryColor,
          accentColor,
          region,
          stateCode: stateInfo?.stateCode,
          defaultKeywords: [
            `campeonato ${slug}`,
            `futebol ${slug}`,
            'placar ao vivo',
            'tabela de classificacao',
            'jogos de hoje',
            'notificacoes gol'
          ],
          features: [
            `Cobertura completa de todos os clubes do ${leagueName}`,
            'Placar ao vivo instantâneo com push notification em tempo real',
            'Tabela atualizada rodada a rodada com saldo de gols e chaveamento',
            'Escalações oficiais antecipadas antes de rolar a bola',
            'Melhores momentos em vídeo, artilharia e notícias apuradas'
          ],
          privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
          supportEmail: 'suporte@zapscore.com.br',
          bundleVersion: '1.0.0',
          bundleCode: 1
        });
      }
    } catch (err) {
      console.warn(`Aviso na varredura da pasta ${folderName}:`, err);
    }
  }

  return discovered;
}

/**
 * Retorna todos os aplicativos: Catálogo Base + Apps Descobertos por Varredura Automática
 */
export function getDynamicEcosystemApps(): EcosystemApp[] {
  const discovered = discoverClonedApps();
  return [...ECOSYSTEM_APPS, ...discovered];
}

/**
 * Busca app por ID considerando catálogo estático + descobertas dinâmicas
 */
export function getDynamicAppById(id: string): EcosystemApp | undefined {
  const all = getDynamicEcosystemApps();
  return all.find((app) => app.id === id);
}
