import { NextResponse } from 'next/server';

/**
 * Hostname-based routing middleware.
 *
 * dimensionvisiontrack.com / www.dimensionvisiontrack.com
 *   → Serves the marketing landing page at "/"
 *   → Passes through /login, /register (CTA targets)
 *   → Blocks access to app-only routes (dashboard, sites, etc.)
 *
 * app.dimensionvisiontrack.com
 *   → Full app (dashboard, sites, workers, etc.)
 *   → Redirects /marketing to the marketing domain
 *
 * localhost (development)
 *   → Everything accessible, no rewrites
 */

// Marketing domain hostnames
const MARKETING_HOSTS = [
  'dimensionvisiontrack.com',
  'www.dimensionvisiontrack.com',
];

const APP_HOST = 'app.dimensionvisiontrack.com';

// Paths that are allowed on the marketing domain (besides the root)
const MARKETING_ALLOWED_PATHS = [
  '/login',
  '/register',
  '/marketing',
  '/api',         // API routes should always work
  '/_next',       // Next.js internals
  '/images',      // Static assets
  '/favicon.ico',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host')?.replace(/:\d+$/, '') || '';

  // ─── Development: no routing logic ───
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('localhost:')) {
    return NextResponse.next();
  }

  // ─── Marketing domain: dimensionvisiontrack.com ───
  if (MARKETING_HOSTS.includes(hostname)) {
    // Allow root and marketing-specific paths through
    if (pathname === '/' || MARKETING_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Block all app routes — redirect to the app subdomain
    const appUrl = new URL(pathname, `https://${APP_HOST}`);
    appUrl.search = request.nextUrl.search;
    return NextResponse.redirect(appUrl);
  }

  // ─── App domain: app.dimensionvisiontrack.com ───
  if (hostname === APP_HOST) {
    // Redirect /marketing to the marketing site root
    if (pathname === '/marketing') {
      return NextResponse.redirect(new URL('/', `https://dimensionvisiontrack.com`));
    }

    // Everything else: normal app routing
    return NextResponse.next();
  }

  // ─── Firebase default domains (*.web.app, *.firebaseapp.com) ───
  // Let everything through with no rewrites
  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
};
