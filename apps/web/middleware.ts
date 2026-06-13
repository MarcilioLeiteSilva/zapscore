import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercepta rotas do painel administrativo
  if (pathname.startsWith('/adminpanel')) {
    const adminToken = request.cookies.get('zapscore_admin_token')?.value;
    const expectedPasskey = process.env.ADMIN_PASSKEY;

    // Se não estiver configurado ou o token for inválido, redireciona para login
    if (!expectedPasskey || adminToken !== expectedPasskey) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminpanel/:path*'],
};
