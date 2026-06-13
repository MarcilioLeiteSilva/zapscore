import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();
    const expectedPasskey = process.env.ADMIN_PASSKEY;

    if (!expectedPasskey) {
      return NextResponse.json(
        { error: 'Passkey administrativa não configurada no servidor' },
        { status: 500 }
      );
    }

    if (passkey === expectedPasskey) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('zapscore_admin_token', passkey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 semana
      });
      return response;
    }

    return NextResponse.json({ error: 'Passkey incorreta' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no servidor: ' + err.message }, { status: 500 });
  }
}
