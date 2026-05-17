import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/register';
    const isProtectedRoute = !isAuthPage;

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/register', '/dashboard/:path*', '/staff/:path*', '/users/:path*', '/add-staff', '/add-user', '/edit-staff/:path*', '/edit-user/:path*', '/profile'],
};