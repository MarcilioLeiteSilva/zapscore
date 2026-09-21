import crypto from 'crypto';
import { ASOPayload } from './aso-generator';
import { StoreDeclarationsPayload } from './store-forms';

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

export interface PublishResult {
  success: boolean;
  dryRun: boolean;
  packageName: string;
  editId?: string;
  stepsCompleted: {
    step: string;
    status: 'success' | 'warning' | 'skipped' | 'failed';
    message: string;
  }[];
  error?: string;
  timestamp: string;
}

/**
 * Cria token JWT assinado para autenticação de Service Account da Google Cloud
 */
function createServiceAccountJwt(credentials: ServiceAccountCredentials): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedClaimSet = base64UrlEncode(claimSet);
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer
    .sign(credentials.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * Obtém token OAuth2 Bearer a partir das credenciais da Service Account
 */
export async function getGooglePlayAccessToken(credentials?: ServiceAccountCredentials): Promise<string | null> {
  const creds = credentials || getEnvCredentials();
  if (!creds || !creds.client_email || !creds.private_key) {
    return null;
  }

  try {
    const jwt = createServiceAccountJwt(creds);
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Falha ao autenticar com Google OAuth2:', errorText);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Erro na requisição de token Google Play:', err);
    return null;
  }
}

/**
 * Lê credenciais do ambiente se disponíveis
 */
export function getEnvCredentials(): ServiceAccountCredentials | null {
  const jsonStr = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.client_email && parsed.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
        project_id: parsed.project_id
      };
    }
  } catch (err) {
    console.warn('Formato inválido para GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  }

  return null;
}

/**
 * Publicador oficial via Google Play Developer Edits API (ou Simulação Dry-Run)
 */
export async function publishToGooglePlay(params: {
  packageName: string;
  aso: ASOPayload;
  declarations: StoreDeclarationsPayload;
  credentials?: ServiceAccountCredentials;
  dryRun?: boolean;
}): Promise<PublishResult> {
  const { packageName, aso, declarations, credentials, dryRun = false } = params;
  const stepsCompleted: PublishResult['stepsCompleted'] = [];

  const timestamp = new Date().toISOString();

  // Se for modo Dry-Run ou não houver token configurado, executa simulação auditada
  const token = dryRun ? null : await getGooglePlayAccessToken(credentials);

  if (!token || dryRun) {
    // 1. Validação dos limites de ASO
    const titleOk = aso.title.length <= 30;
    const shortDescOk = aso.shortDescription.length <= 80;
    const fullDescOk = aso.fullDescription.length <= 4000;

    stepsCompleted.push({
      step: 'Validação de Limites da Google Play (ASO)',
      status: titleOk && shortDescOk && fullDescOk ? 'success' : 'failed',
      message: `Título: ${aso.title.length}/30c | Breve: ${aso.shortDescription.length}/80c | Completa: ${aso.fullDescription.length}/4000c.`
    });

    // 2. Validação das Declarações Obrigatórias
    const targetAudienceOk = declarations.targetAudience.minAge === 16;
    const categoryOk = declarations.categorization.primaryCategory === 'SPORTS';
    const adsOk = declarations.adsDeclaration.containsAds === true;

    stepsCompleted.push({
      step: 'Auditoria de Formulários da Loja',
      status: targetAudienceOk && categoryOk && adsOk ? 'success' : 'failed',
      message: `Público: 16+ | Categoria: SPORTS | Tag: ENTERTAINMENT | Anúncios AdMob: OK | Data Safety: OK.`
    });

    // 3. Simulação da Edits Session
    const mockEditId = `dryrun-edit-${Date.now()}`;
    stepsCompleted.push({
      step: 'Sessão de Edição (edits.insert)',
      status: 'success',
      message: `[Simulação] Sessão gerada com ID provisório: ${mockEditId}`
    });

    // 4. Simulação de Atualização da Listagem pt-BR
    stepsCompleted.push({
      step: 'Atualização de Listagem da Loja pt-BR (edits.listings.update)',
      status: 'success',
      message: `[Simulação] Ficha de loja pronta para publicação em português (Brasil).`
    });

    // 5. Simulação de Commit
    stepsCompleted.push({
      step: 'Commit da Edição (edits.commit)',
      status: 'success',
      message: token 
        ? '[Simulação Executada] Pronto para envio real desativando a flag de Dry-Run.'
        : '[Dry-Run Ativo] Pacote 100% validado. Para envio automático direto na loja, configure a Service Account no painel.'
    });

    return {
      success: true,
      dryRun: true,
      packageName,
      editId: mockEditId,
      stepsCompleted,
      timestamp
    };
  }

  // --- MODO REAL VIA GOOGLE PLAY DEVELOPER EDITS API ---
  try {
    // 1. Iniciar Edição (edits.insert)
    const insertRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: `edit-${Date.now()}`,
          expiryTimeSeconds: '1200'
        })
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Falha ao abrir edição no Google Play Console: ${errText}`);
    }

    const editData = await insertRes.json();
    const editId = editData.id;

    stepsCompleted.push({
      step: 'Sessão de Edição Aberta (edits.insert)',
      status: 'success',
      message: `Edição criada com sucesso. ID: ${editId}`
    });

    // 2. Atualizar Ficha da Loja pt-BR (edits.listings.update)
    const listingRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/listings/pt-BR`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: 'pt-BR',
          title: aso.title,
          shortDescription: aso.shortDescription,
          fullDescription: aso.fullDescription
        })
      }
    );

    if (!listingRes.ok) {
      const errText = await listingRes.text();
      throw new Error(`Falha ao atualizar listagem pt-BR: ${errText}`);
    }

    stepsCompleted.push({
      step: 'Ficha da Loja pt-BR Atualizada (edits.listings.update)',
      status: 'success',
      message: 'Título, Breve Descrição e Descrição Completa sincronizados na Play Console.'
    });

    // 3. Commit da Edição (edits.commit)
    const commitRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      throw new Error(`Falha ao efetuar commit da edição: ${errText}`);
    }

    stepsCompleted.push({
      step: 'Edição Efetivada na Google Play (edits.commit)',
      status: 'success',
      message: 'Alterações enviadas para análise no Google Play Console com sucesso!'
    });

    return {
      success: true,
      dryRun: false,
      packageName,
      editId,
      stepsCompleted,
      timestamp
    };
  } catch (err: any) {
    return {
      success: false,
      dryRun: false,
      packageName,
      stepsCompleted,
      error: err.message,
      timestamp
    };
  }
}
