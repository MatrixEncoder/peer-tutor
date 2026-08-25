"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StarRating from "@/components/StarRating";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentSession {
  id: string;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  totalCost: number;
  tutorProfile: { user: { name: string; university: string } };
  review: { rating: number; comment: string | null } | null;
}

interface TutorSession {
  id: string;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  totalCost: number;
  student: { name: string; email: string; university: string };
  review: { rating: number } | null;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard",    icon: "⊞", key: "dashboard" },
  { label: "Find Tutors",  icon: "🔍", key: "tutors",   href: "/tutors" },
  { label: "My Sessions",  icon: "📅", key: "sessions" },
  { label: "Profile",      icon: "👤", key: "profile",  href: "/profile" },
  { label: "Settings",     icon: "⚙",  key: "settings", href: "/profile" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusCounts(sessions: StudentSession[] | TutorSession[]) {
  const counts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
  sessions.forEach((s) => {
    if (s.status in counts) counts[s.status as keyof typeof counts]++;
  });
  return counts;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [view, setView] = useState<"student" | "tutor">("student");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [tutorSessions, setTutorSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      fetch("/api/sessions?role=student").then((r) => r.json()),
      fetch("/api/sessions?role=tutor").then((r) => r.json()),
    ]).then(([s, t]) => {
      setStudentSessions(Array.isArray(s) ? s : []);
      setTutorSessions(Array.isArray(t) ? t : []);
      setLoading(false);
    });
  }, [session]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const [s, t] = await Promise.all([
      fetch("/api/sessions?role=student").then((r) => r.json()),
      fetch("/api/sessions?role=tutor").then((r) => r.json()),
    ]);
    setStudentSessions(Array.isArray(s) ? s : []);
    setTutorSessions(Array.isArray(t) ? t : []);
  }

  async function submitReview() {
    if (!reviewingId) return;
    setReviewLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: reviewingId, rating: reviewRating, comment: reviewComment }),
    });
    setReviewLoading(false);
    setReviewingId(null);
    setReviewComment("");
    setReviewRating(5);
    const s = await fetch("/api/sessions?role=student").then((r) => r.json());
    setStudentSessions(Array.isArray(s) ? s : []);
  }

  if (status === "loading" || loading) return <DashboardSkeleton />;

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userRole = session?.user?.role ?? "STUDENT";
  const isTutor = userRole === "TUTOR" || userRole === "BOTH";

  // Stats derived from session data
  const activeSessions = view === "student" ? studentSessions : tutorSessions;
  const counts = statusCounts(activeSessions);
  const upcomingSessions = activeSessions
    .filter((s) => s.status === "PENDING" || s.status === "CONFIRMED")
    .slice(0, 3);

  // Profile completion percentage (simple heuristic)
  const profileScore = [userName, userEmail, userRole !== "STUDENT"].filter(Boolean).length;
  const profilePct = Math.round((profileScore / 3) * 100);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PT</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm">PeerTutor</div>
              <div className="text-slate-500 text-xs">Connect, Learn & Explore</div>
            </div>
          </div>
        </div>

        {/* User Profile card */}
        <div className="p-5 border-b border-slate-800 text-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700
                          flex items-center justify-center text-white text-xl font-bold mx-auto mb-3
                          ring-2 ring-violet-500/30 ring-offset-2 ring-offset-slate-900">
            {getInitials(userName)}
          </div>
          <div className="text-white font-semibold text-sm">{userName}</div>
          <div className="text-slate-500 text-xs mt-0.5 truncate">{userEmail}</div>
          <div className="text-violet-400 text-xs mt-1">
            {isTutor ? "Tutor ID · " + userEmail.split("@")[0].toUpperCase() : "Student"}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.key;
            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile completion */}
        <div className="p-5 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-3">
            Profile Completed:{" "}
            <span className="text-violet-400 font-semibold">{profilePct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4">
            <div
              className="h-1.5 bg-violet-500 rounded-full transition-all"
              style={{ width: `${profilePct}%` }}
            />
          </div>
          <div className="space-y-2">
            {[
              { label: "Basic Info", done: !!userName },
              { label: "Role Setup", done: userRole !== "STUDENT" || true },
              { label: "Sessions",   done: activeSessions.length > 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.done ? "bg-violet-500" : "bg-slate-700"}`} />
                <span className={`text-xs ${item.done ? "text-slate-300" : "text-slate-600"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 w-full text-left text-xs text-slate-600 hover:text-red-400 transition-colors px-3 py-2"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm
                           flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-slate-400 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>

          <div className="flex items-center gap-4">
            {/* Role toggle */}
            {isTutor && (
              <div className="flex bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setView("student")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === "student" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => setView("tutor")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === "tutor" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tutor
                </button>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button className="text-slate-400 hover:text-white text-lg">🔔</button>
              {counts.PENDING > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white
                                 text-[10px] rounded-full flex items-center justify-center">
                  {counts.PENDING}
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700
                            flex items-center justify-center text-white text-xs font-bold">
              {getInitials(userName)}
            </div>
            <span className="text-slate-300 text-sm font-medium">{userName}</span>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Hero welcome ──────────────────────────────────────── */}
          <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700
                          rounded-2xl p-6 overflow-hidden">
            {/* Background glow */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Hello, {userName.split(" ")[0]} 👋
                </h1>
                <p className="text-slate-400 text-sm mb-4 max-w-md">
                  {view === "student"
                    ? "Track your tutoring sessions, reviews, and academic progress all in one place."
                    : "Manage your student requests, availability, and teaching schedule."}
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Member since</span>
                    <span className="text-slate-300 ml-2">2025</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total sessions</span>
                    <span className="text-violet-400 font-semibold ml-2">{activeSessions.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Completed</span>
                    <span className="text-emerald-400 font-semibold ml-2">{counts.COMPLETED}</span>
                  </div>
                </div>
              </div>

              {/* Decorative illustration */}
              <div className="hidden md:flex w-28 h-28 rounded-2xl bg-violet-600/10 border border-violet-500/20
                              items-center justify-center text-5xl flex-shrink-0">
                {view === "student" ? "📚" : "🎓"}
              </div>
            </div>
          </div>

          {/* ── Action cards row ──────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Profile completion */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group
                            hover:border-violet-500/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20
                                flex items-center justify-center text-blue-400 text-lg">
                  👤
                </div>
                <span className="text-2xl font-bold text-white">{profilePct}%</span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Profile complete</div>
              <div className="text-slate-500 text-xs mb-3">
                {profilePct < 100 ? "Add more info to stand out" : "Your profile is complete!"}
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${profilePct}%` }} />
              </div>
              <Link href="/profile" className="text-violet-400 text-xs hover:text-violet-300 flex items-center gap-1">
                Update Profile →
              </Link>
            </div>

            {/* Availability / verification */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group
                            hover:border-violet-500/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20
                                flex items-center justify-center text-violet-400 text-lg">
                  {isTutor ? "📆" : "🔍"}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  isTutor
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-violet-500/10 text-violet-400 border-violet-500/30"
                }`}>
                  {isTutor ? "Active" : "Student"}
                </span>
              </div>
              <div className="text-white font-medium text-sm mb-1">
                {isTutor ? "Availability" : "Find Tutors"}
              </div>
              <div className="text-slate-500 text-xs mb-4">
                {isTutor
                  ? "Manage your weekly schedule and open slots"
                  : "Search for the perfect tutor for your course"}
              </div>
              <Link
                href={isTutor ? "/profile" : "/tutors"}
                className="text-violet-400 text-xs hover:text-violet-300 flex items-center gap-1"
              >
                {isTutor ? "Edit Schedule →" : "Browse Tutors →"}
              </Link>
            </div>

            {/* Pending sessions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group
                            hover:border-violet-500/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20
                                flex items-center justify-center text-amber-400 text-lg">
                  ⏳
                </div>
                <span className="text-2xl font-bold text-white">
                  {String(counts.PENDING).padStart(2, "0")}
                </span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Pending</div>
              <div className="text-slate-500 text-xs mb-4">
                {counts.PENDING > 0
                  ? `${counts.PENDING} session${counts.PENDING > 1 ? "s" : ""} awaiting action`
                  : "No pending sessions right now"}
              </div>
              <button
                onClick={() => setActiveNav("sessions")}
                className="text-violet-400 text-xs hover:text-violet-300 flex items-center gap-1"
              >
                View all →
              </button>
            </div>
          </div>

          {/* ── Upcoming sessions + Stats side by side ────────────── */}
          <div className="grid grid-cols-5 gap-4">

            {/* Upcoming sessions */}
            <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Upcoming Sessions</h2>
                <span className="text-xs text-slate-500">
                  {upcomingSessions.length} scheduled
                </span>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-slate-500 text-sm">No upcoming sessions</p>
                  <Link href="/tutors" className="text-violet-400 text-xs hover:text-violet-300 mt-2 block">
                    Book a session →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((s) => (
                    <UpcomingSessionCard
                      key={s.id}
                      session={s}
                      view={view}
                      onConfirm={(id) => updateStatus(id, "CONFIRMED")}
                      onComplete={(id) => updateStatus(id, "COMPLETED")}
                      onCancel={(id) => updateStatus(id, "CANCELLED")}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity / all sessions list */}
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">All Sessions</h2>
              </div>

              {activeSessions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🗂️</div>
                  <p className="text-slate-500 text-sm">Nothing here yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeSessions.slice(0, 8).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2
                                               border-b border-slate-800 last:border-0">
                      <div>
                        <div className="text-white text-xs font-medium truncate max-w-[120px]">
                          {s.subject}
                        </div>
                        <div className="text-slate-500 text-xs">{s.scheduledDate}</div>
                      </div>
                      <StatusDot status={s.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* Review pending sessions */}
              {view === "student" &&
                (activeSessions as StudentSession[])
                  .filter((s) => s.status === "COMPLETED" && !s.review)
                  .slice(0, 1)
                  .map((s) => (
                    <div key={s.id} className="mt-4 p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl">
                      <p className="text-violet-300 text-xs mb-2">Leave a review for</p>
                      <p className="text-white text-xs font-medium mb-2 truncate">{s.subject}</p>
                      <button
                        onClick={() => setReviewingId(s.id)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Review →
                      </button>
                    </div>
                  ))}
            </div>
          </div>

          {/* ── Bottom stats strip ────────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex">
            {[
              { label: "Pending",   value: counts.PENDING,   color: "text-amber-400",  bg: "bg-amber-500/10",   active: false },
              { label: "Confirmed", value: counts.CONFIRMED,  color: "text-emerald-400", bg: "bg-emerald-500/10", active: true  },
              { label: "Completed", value: counts.COMPLETED,  color: "text-blue-400",    bg: "bg-blue-500/10",    active: false },
              { label: "Cancelled", value: counts.CANCELLED,  color: "text-red-400",     bg: "bg-red-500/10",     active: false },
              { label: "Total",     value: activeSessions.length, color: "text-violet-400", bg: "bg-violet-500/10", active: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl transition-colors
                  ${stat.active ? "bg-violet-600 shadow-lg shadow-violet-600/30" : "hover:bg-slate-800"}`}
              >
                <div className={`text-2xl font-bold ${stat.active ? "text-white" : stat.color}`}>
                  {String(stat.value).padStart(2, "0")}
                </div>
                <div className={`text-xs mt-1 ${stat.active ? "text-violet-200" : "text-slate-500"}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Review Modal ──────────────────────────────────────────────────────── */}
      {reviewingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center
                        justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md
                          shadow-2xl">
            <h3 className="font-bold text-white text-lg mb-1">Leave a review</h3>
            <p className="text-slate-400 text-sm mb-5">Rate your session experience</p>

            <div className="flex gap-3 mb-5 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-4xl transition-all hover:scale-110 active:scale-95 ${
                    star <= reviewRating ? "text-amber-400" : "text-slate-700"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="input resize-none h-24 text-sm mb-4"
              placeholder="Share what you found helpful… (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={submitReview} className="btn-primary flex-1" disabled={reviewLoading}>
                {reviewLoading ? "Submitting…" : "Submit review"}
              </button>
              <button onClick={() => setReviewingId(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UpcomingSessionCard({
  session: s,
  view,
  onConfirm,
  onComplete,
  onCancel,
}: {
  session: StudentSession | TutorSession;
  view: "student" | "tutor";
  onConfirm: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const tutorName = view === "student"
    ? (s as StudentSession).tutorProfile?.user?.name
    : (s as TutorSession).student?.name;

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800
                    transition-colors group">
      {/* Color accent */}
      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
        s.status === "CONFIRMED" ? "bg-emerald-500" : "bg-amber-500"
      }`} />

      <div className="flex-1 min-w-0">
        <div className="text-xs text-violet-400 font-mono mb-0.5">
          #{s.id.slice(0, 6).toUpperCase()}
        </div>
        <div className="text-white text-sm font-medium truncate">{s.subject}</div>
        <div className="text-slate-400 text-xs">
          {view === "student" ? `with ${tutorName}` : `Student: ${tutorName}`}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-slate-300 text-xs">{s.scheduledTime}</div>
        <div className="text-slate-500 text-xs">{s.scheduledDate}</div>
        <div className="text-slate-600 text-xs">{s.durationMinutes} min</div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {view === "tutor" && s.status === "PENDING" && (
          <button
            onClick={() => onConfirm(s.id)}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs
                       px-2 py-1 rounded-lg transition-colors border border-emerald-500/30"
          >
            ✓
          </button>
        )}
        {view === "tutor" && s.status === "CONFIRMED" && (
          <button
            onClick={() => onComplete(s.id)}
            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs
                       px-2 py-1 rounded-lg transition-colors border border-blue-500/30"
          >
            ✓✓
          </button>
        )}
        <button
          onClick={() => onCancel(s.id)}
          className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs
                     px-2 py-1 rounded-lg transition-colors border border-red-500/30"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-400",
    CONFIRMED: "bg-emerald-400",
    COMPLETED: "bg-blue-400",
    CANCELLED: "bg-red-400",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] ?? "bg-slate-600"}`} />
      <span className="text-slate-500 text-xs">{status.toLowerCase()}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-slate-950">
      <div className="w-64 bg-slate-900 border-r border-slate-800 animate-pulse" />
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-36 bg-slate-900 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-slate-900 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    </div>
  );
}
