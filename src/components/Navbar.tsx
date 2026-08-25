"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

// Days of week — used in a few places across the app
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide global navbar in landing page and dashboard as they have custom layouts
  if (pathname === "/" || pathname?.startsWith("/dashboard")) {
    return null;
  }


  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PT</span>
          </div>
          <span className="font-bold text-white text-lg">PeerTutor</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/tutors"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Find Tutors
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/profile" className="text-sm text-slate-400 hover:text-white">
                {session.user.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-secondary text-sm py-1.5 px-4"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary text-sm py-1.5">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
