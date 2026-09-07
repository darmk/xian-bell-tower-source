import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const target = request.nextUrl.clone();
    target.pathname = '/xianBellTower';
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/'] };

export default proxy;
