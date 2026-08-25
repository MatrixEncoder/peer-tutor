"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";

interface TutorProfile {
  id: string;
  hourlyRate: number;
  avgRating: number;
  totalReviews: number;
  subjects: string;
  user: {
    name: string;
    university: string;
    department: string;
    bio: string | null;
  };
}

const DEPARTMENTS = [
  "All", "Computer Science", "Mathematics", "Physics", "Chemistry",
  "Biology", "Economics", "Engineering", "Psychology",
];

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("All");
  const [minRating, setMinRating] = useState(0);

  async function fetchTutors() {
    setLoading(true);
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (department !== "All") params.set("department", department);
    if (minRating > 0) params.set("minRating", String(minRating));

    const res = await fetch(`/api/tutors?${params.toString()}`);
    const data = await res.json();
    setTutors(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchTutors();
  }, [subject, department, minRating]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="section-title">Find a tutor</h1>
        <p className="text-slate-400 text-sm">
          {tutors.length} tutors available
        </p>
      </div>

      <div className="flex gap-8">
        {/* ── Filters sidebar ─────────────────────── */}
        <aside className="w-56 flex-shrink-0 space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Filters</h2>

            {/* Subject search */}
            <div className="mb-4">
              <label className="label">Subject / course code</label>
              <input
                id="filter-subject"
                className="input text-sm"
                placeholder="e.g. CS301"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="mb-4">
              <label className="label">Department</label>
              <div className="space-y-1.5">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepartment(d)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      department === d
                        ? "bg-violet-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Min rating */}
            <div>
              <label className="label">Minimum rating</label>
              <div className="space-y-1.5">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      minRating === r
                        ? "bg-violet-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {r === 0 ? "Any rating" : `${r}★ and up`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Tutor list ──────────────────────────── */}
        <div className="flex-1">
          {loading ? (
            // Skeleton loaders
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-1/2 mb-3" />
                  <div className="h-3 bg-slate-800 rounded w-1/3 mb-4" />
                  <div className="h-12 bg-slate-800 rounded mb-4" />
                  <div className="h-8 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-slate-400">No tutors match your filters.</p>
              <button
                onClick={() => { setSubject(""); setDepartment("All"); setMinRating(0); }}
                className="btn-secondary mt-4 text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tutor Card ─────────────────────────────────────────────────────

function TutorCard({ tutor }: { tutor: TutorProfile }) {
  const subjectList = tutor.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="card hover:border-slate-600 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700
                          flex items-center justify-center text-white font-bold mb-2">
            {tutor.user.name.charAt(0)}
          </div>
          <h3 className="font-semibold text-white">{tutor.user.name}</h3>
          <p className="text-slate-500 text-xs">
            {tutor.user.university} · {tutor.user.department}
          </p>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-lg">
            ${tutor.hourlyRate}<span className="text-slate-500 text-sm font-normal">/hr</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating rating={tutor.avgRating} />
        <span className="text-slate-400 text-xs">
          {tutor.avgRating > 0 ? tutor.avgRating.toFixed(1) : "No reviews yet"}
          {tutor.totalReviews > 0 && ` (${tutor.totalReviews})`}
        </span>
      </div>

      {/* Bio */}
      {tutor.user.bio && (
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{tutor.user.bio}</p>
      )}

      {/* Subject tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {subjectList.map((s) => (
          <span
            key={s}
            className="bg-violet-600/10 border border-violet-500/20 text-violet-300
                       text-xs px-2.5 py-1 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      <Link
        href={`/tutors/${tutor.id}`}
        className="btn-primary w-full text-center text-sm block"
      >
        View profile & book
      </Link>
    </div>
  );
}
