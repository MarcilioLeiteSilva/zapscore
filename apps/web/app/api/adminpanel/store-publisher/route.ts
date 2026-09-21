import { NextResponse } from 'next/server';
import { generateStoreDeclarations, getPlayConsoleFormChecklist } from '@/app/(main)/adminpanel/agents/store-publisher/lib/store-forms';
import { generateASOWithAI, generateLocalASO } from '@/app/(main)/adminpanel/agents/store-publisher/lib/aso-generator';
import { generateVisualAssetsSpecs } from '@/app/(main)/adminpanel/agents/store-publisher/lib/canva-service';
import { getDynamicEcosystemApps, getDynamicAppById } from '@/app/(main)/adminpanel/agents/store-publisher/lib/auto-discovery';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    // Se passou appId específico, retorna detalhes completos desse app
    if (appId) {
      const app = getDynamicAppById(appId);
      if (!app) {
        return NextResponse.json(
          { error: `Aplicativo com id '${appId}' não encontrado no catálogo.` },
          { status: 404 }
        );
      }

      const declarations = generateStoreDeclarations(app);
      const checklist = getPlayConsoleFormChecklist(appId);
      const aso = generateLocalASO(app);
      const visualAssets = generateVisualAssetsSpecs(app);

      return NextResponse.json({
        app,
        declarations,
        checklist,
        aso,
        visualAssets
      });
    }

    // Retorna listagem dinâmica de todos os apps do ecossistema (catálogo + apps clonados descobertos)
    const allApps = getDynamicEcosystemApps();
    const list = allApps.map((app) => ({
      id: app.id,
      name: app.name,
      shortName: app.shortName,
      leagueName: app.leagueName,
      packageName: app.packageName,
      region: app.region,
      stateCode: app.stateCode,
      primaryColor: app.primaryColor,
      hasFormsReady: true,
      hasASOReady: true,
      hasCanvaReady: true
    }));

    return NextResponse.json({ apps: list, total: list.length, fullApps: allApps });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Falha ao consultar catálogo do Store Publisher: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, useAI } = body;

    if (!appId) {
      return NextResponse.json(
        { error: 'Parâmetro appId é obrigatório.' },
        { status: 400 }
      );
    }

    const app = getDynamicAppById(appId);
    if (!app) {
      return NextResponse.json(
        { error: `Aplicativo com id '${appId}' não encontrado.` },
        { status: 404 }
      );
    }

    // Gera ASO (com ou sem IA dependendo da opção e disponibilidade de chave)
    const aso = useAI ? await generateASOWithAI(app) : generateLocalASO(app);

    // Gera Formulários da Loja (16+, SPORTS, ENTERTAINMENT, AdMob, Data Safety, IARC)
    const declarations = generateStoreDeclarations(app);
    const checklist = getPlayConsoleFormChecklist(appId);
    const visualAssets = generateVisualAssetsSpecs(app);

    return NextResponse.json({
      success: true,
      app,
      aso,
      declarations,
      checklist,
      visualAssets,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Falha ao processar dados do Store Publisher: ' + err.message },
      { status: 500 }
    );
  }
}

