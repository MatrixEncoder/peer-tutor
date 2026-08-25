// Middleware file — intentionally minimal.
// Auth protection is handled in each page directly using server-side checks,
// which avoids the Edge Runtime restriction on Node.js modules like better-sqlite3.

export function middleware() {
  // No-op — protected pages check auth themselves
}

export const config = {
  matcher: [], // empty = no routes intercepted
};
