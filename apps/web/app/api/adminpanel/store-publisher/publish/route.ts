import { NextResponse } from 'next/server';
import { getDynamicAppById } from '@/app/(main)/adminpanel/agents/store-publisher/lib/auto-discovery';
import { generateStoreDeclarations } from '@/app/(main)/adminpanel/agents/store-publisher/lib/store-forms';
import { generateASOWithAI, generateLocalASO } from '@/app/(main)/adminpanel/agents/store-publisher/lib/aso-generator';
import { publishToGooglePlay } from '@/app/(main)/adminpanel/agents/store-publisher/lib/google-play-api';
import { generateExportPackage } from '@/app/(main)/adminpanel/agents/store-publisher/lib/export-package';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, useAI = false, dryRun = true, credentials } = body;

    if (!appId) {
      return NextResponse.json(
        { error: 'Parâmetro appId é obrigatório.' },
        { status: 400 }
      );
    }

    const app = getDynamicAppById(appId);
    if (!app) {
      return NextResponse.json(
        { error: `Aplicativo com id '${appId}' não encontrado no catálogo.` },
        { status: 404 }
      );
    }

    // 1. Gera ASO e Declarações
    const aso = useAI ? await generateASOWithAI(app) : generateLocalASO(app);
    const declarations = generateStoreDeclarations(app);

    // 2. Executa a publicação (ou simulação Dry-Run segura)
    const publishResult = await publishToGooglePlay({
      packageName: app.packageName,
      aso,
      declarations,
      credentials,
      dryRun: Boolean(dryRun)
    });

    // 3. Gera o pacote consolidado para download / backup
    const exportPackage = generateExportPackage(app, aso, declarations);

    return NextResponse.json({
      success: publishResult.success,
      publishResult,
      exportPackage,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Falha ao orquestrar publicação na Google Play: ' + err.message },
      { status: 500 }
    );
  }
}
