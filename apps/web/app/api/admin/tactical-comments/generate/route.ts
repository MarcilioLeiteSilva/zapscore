import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || "https://zapscore-zapscore-api.gtalg3.easypanel.host";
const SERVER_ADMIN_API_KEY = process.env.ADMIN_API_KEY || "7Ma+1d8R2VkkAEUzGNLhrVYaoYfOLaUdxXTkocQa+ac=";

export async function POST(request: Request) {
  try {
    // 1. Verificação de sessão administrativa via cookie seguro HttpOnly
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('zapscore_admin_token')?.value;
    const expectedPasskey = process.env.ADMIN_PASSKEY;

    if (expectedPasskey && adminToken !== expectedPasskey) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login administrativo novamente.' },
        { status: 401 }
      );
    }

    // 2. Extrai parâmetros da requisição
    const body = await request.json();
    const { fixtureId, minute, phase, externalContextUrl } = body;

    if (!fixtureId) {
      return NextResponse.json(
        { error: 'fixtureId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Encaminha com ADMIN_API_KEY mantida estritamente no servidor Node.js (invisível ao cliente)
    const backendRes = await fetch(`${API_URL}/fixtures/${fixtureId}/comments/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SERVER_ADMIN_API_KEY,
      },
      body: JSON.stringify({
        minute: minute !== undefined ? Number(minute) : undefined,
        phase: phase || undefined,
        externalContextUrl: externalContextUrl || undefined,
      }),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Falha no proxy de geração de comentários: ' + err.message },
      { status: 500 }
    );
  }
}
