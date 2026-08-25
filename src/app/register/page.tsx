"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Chemistry",
  "Biology", "Economics", "Engineering", "Psychology", "English", "History",
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    department: "",
    yearOfStudy: 1,
    role: "STUDENT" as "STUDENT" | "TUTOR" | "BOTH",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create the account
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">PT</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join PeerTutor in under a minute</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@uni.edu"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* University */}
            <div>
              <label className="label">University</label>
              <input
                id="university"
                className="input"
                placeholder="e.g. University of Toronto"
                value={form.university}
                onChange={(e) => update("university", e.target.value)}
                required
              />
            </div>

            {/* Department + Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <select
                  id="department"
                  className="input"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year of study</label>
                <select
                  id="yearOfStudy"
                  className="input"
                  value={form.yearOfStudy}
                  onChange={(e) => update("yearOfStudy", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label">I want to…</label>
              <div className="grid grid-cols-3 gap-3">
                {(["STUDENT", "TUTOR", "BOTH"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update("role", r)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.role === r
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {r === "STUDENT" ? "Find tutors" : r === "TUTOR" ? "Teach only" : "Both"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm
                              rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="register-submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
