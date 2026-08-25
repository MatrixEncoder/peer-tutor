"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StarRating from "@/components/StarRating";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

interface TutorData {
  id: string;
  hourlyRate: number;
  avgRating: number;
  totalReviews: number;
  subjects: string;
  isVerified: boolean;
  user: {
    name: string;
    university: string;
    department: string;
    yearOfStudy: number;
    bio: string | null;
  };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string };
  }[];
}

export default function TutorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    subject: "",
    scheduledDate: "",
    scheduledTime: "",
    durationMinutes: 60,
    notes: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/tutors/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setTutor(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    setBookingLoading(true);
    setBookingError("");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...booking, tutorProfileId: tutor!.id }),
    });

    const data = await res.json();
    setBookingLoading(false);

    if (!res.ok) {
      setBookingError(data.error || "Booking failed");
    } else {
      setBookingSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-800 rounded w-1/4 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card h-64" />
          <div className="card h-64" />
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Tutor not found.</p>
      </div>
    );
  }

  const subjects = tutor.subjects.split(",").map((s) => s.trim()).filter(Boolean);
  const cost = ((tutor.hourlyRate * booking.durationMinutes) / 60).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* ── Profile header ──────────────────────────────────── */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700
                        flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {tutor.user.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{tutor.user.name}</h1>
            {tutor.isVerified && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                               text-xs px-2.5 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            {tutor.user.university} · Year {tutor.user.yearOfStudy} · {tutor.user.department}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={tutor.avgRating} />
            <span className="text-slate-400 text-sm">
              {tutor.avgRating > 0 ? tutor.avgRating.toFixed(1) : "No reviews"}{" "}
              {tutor.totalReviews > 0 && `· ${tutor.totalReviews} reviews`}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold text-white">${tutor.hourlyRate}</div>
          <div className="text-slate-500 text-sm">per hour</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          {tutor.user.bio && (
            <div className="card">
              <h2 className="font-semibold text-white mb-3">About</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{tutor.user.bio}</p>
            </div>
          )}

          {/* Subjects */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Subjects</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.length > 0 ? subjects.map((s) => (
                <span
                  key={s}
                  className="bg-violet-600/10 border border-violet-500/20 text-violet-300
                             text-sm px-3 py-1.5 rounded-full"
                >
                  {s}
                </span>
              )) : <p className="text-slate-500 text-sm">No subjects listed yet</p>}
            </div>
          </div>

          {/* Availability */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Weekly availability</h2>
            {tutor.availability.length === 0 ? (
              <p className="text-slate-500 text-sm">No availability set yet</p>
            ) : (
              <div className="space-y-2">
                {DAYS.map((day, i) => {
                  const slots = tutor.availability.filter((a) => a.dayOfWeek === i);
                  if (slots.length === 0) return null;
                  return (
                    <div key={day} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 w-24">{day}</span>
                      <div className="flex gap-2">
                        {slots.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            {s.startTime} – {s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4">
              Reviews ({tutor.totalReviews})
            </h2>
            {tutor.reviews.length === 0 ? (
              <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {tutor.reviews.map((r) => (
                  <div key={r.id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StarRating rating={r.rating} />
                      <span className="text-slate-500 text-xs">
                        by {r.reviewer.name} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-slate-400 text-sm">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Booking form ─────────────────────────────────── */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-semibold text-white mb-4">Book a session</h2>

          {bookingSuccess ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-white font-medium">Booking request sent!</p>
              <p className="text-slate-400 text-sm mt-1">Redirecting to dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="label text-xs">Subject</label>
                <select
                  className="input text-sm"
                  value={booking.subject}
                  onChange={(e) => setBooking((b) => ({ ...b, subject: e.target.value }))}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Date</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={booking.scheduledDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBooking((b) => ({ ...b, scheduledDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Time</label>
                <input
                  type="time"
                  className="input text-sm"
                  value={booking.scheduledTime}
                  onChange={(e) => setBooking((b) => ({ ...b, scheduledTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Duration</label>
                <select
                  className="input text-sm"
                  value={booking.durationMinutes}
                  onChange={(e) =>
                    setBooking((b) => ({ ...b, durationMinutes: Number(e.target.value) }))
                  }
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Notes (optional)</label>
                <textarea
                  className="input text-sm resize-none h-20"
                  placeholder="Topics you want to cover…"
                  value={booking.notes}
                  onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))}
                />
              </div>

              {/* Cost summary */}
              <div className="bg-slate-800 rounded-xl p-3 flex justify-between text-sm">
                <span className="text-slate-400">Estimated cost</span>
                <span className="text-white font-semibold">${cost}</span>
              </div>

              {bookingError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs
                                rounded-xl px-3 py-2">
                  {bookingError}
                </div>
              )}

              <button
                type="submit"
                id="book-session-btn"
                className="btn-primary w-full"
                disabled={bookingLoading}
              >
                {bookingLoading ? "Sending request…" : "Request session →"}
              </button>

              {!session && (
                <p className="text-xs text-center text-slate-500">
                  You'll be asked to sign in first.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
