"use client";

// Wraps the app in the NextAuth SessionProvider so any component
// can call useSession() to get the logged-in user.

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
