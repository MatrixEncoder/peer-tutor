"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ProfileData {
  name: string;
  bio: string;
  university: string;
  department: string;
  yearOfStudy: number;
  role: string;
  tutorProfile: {
    hourlyRate: number;
    subjects: string;
    availability: AvailabilitySlot[];
  } | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Availability slots state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        if (data.tutorProfile?.availability) {
          setSlots(data.tutorProfile.availability);
        }
        setLoading(false);
      });
  }, [session]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        bio: profile.bio,
        university: profile.university,
        department: profile.department,
        yearOfStudy: profile.yearOfStudy,
        hourlyRate: profile.tutorProfile?.hourlyRate,
        subjects: profile.tutorProfile?.subjects,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Profile saved!");
    } else {
      setMessage("Failed to save. Please try again.");
    }
  }

  function addSlot() {
    setSlots((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof AvailabilitySlot, value: string | number) {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  }

  async function saveAvailability() {
    setSavingAvail(true);
    await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });
    setSavingAvail(false);
    setMessage("Availability saved!");
  }

  if (loading || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3 mb-6" />
        <div className="card h-64" />
      </div>
    );
  }

  const isTutor = profile.role === "TUTOR" || profile.role === "BOTH";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="section-title mb-8">Edit Profile</h1>

      {/* ── Basic info ─────────────────────────────────── */}
      <form onSubmit={saveProfile} className="card mb-6 space-y-4">
        <h2 className="font-semibold text-white">Basic info</h2>

        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            value={profile.name}
            onChange={(e) => setProfile((p) => p ? { ...p, name: e.target.value } : p)}
          />
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            className="input resize-none h-24"
            placeholder="Tell students a bit about yourself…"
            value={profile.bio || ""}
            onChange={(e) => setProfile((p) => p ? { ...p, bio: e.target.value } : p)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">University</label>
            <input
              className="input"
              value={profile.university}
              onChange={(e) => setProfile((p) => p ? { ...p, university: e.target.value } : p)}
            />
          </div>
          <div>
            <label className="label">Year of study</label>
            <select
              className="input"
              value={profile.yearOfStudy}
              onChange={(e) =>
                setProfile((p) => p ? { ...p, yearOfStudy: Number(e.target.value) } : p)
              }
            >
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutor-specific fields */}
        {isTutor && (
          <>
            <div>
              <label className="label">Subjects I can teach</label>
              <input
                className="input"
                placeholder="CS301, MATH201, PHY101 (comma-separated)"
                value={profile.tutorProfile?.subjects || ""}
                onChange={(e) =>
                  setProfile((p) =>
                    p
                      ? {
                          ...p,
                          tutorProfile: p.tutorProfile
                            ? { ...p.tutorProfile, subjects: e.target.value }
                            : null,
                        }
                      : p
                  )
                }
              />
            </div>
            <div>
              <label className="label">Hourly rate (USD)</label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.50"
                value={profile.tutorProfile?.hourlyRate || 0}
                onChange={(e) =>
                  setProfile((p) =>
                    p
                      ? {
                          ...p,
                          tutorProfile: p.tutorProfile
                            ? { ...p.tutorProfile, hourlyRate: parseFloat(e.target.value) }
                            : null,
                        }
                      : p
                  )
                }
              />
            </div>
          </>
        )}

        {message && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            message.includes("Failed")
              ? "bg-red-500/10 text-red-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}>
            {message}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* ── Availability (tutor only) ───────────────────── */}
      {isTutor && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Weekly availability</h2>
          <p className="text-slate-500 text-sm">
            Set the time slots when students can book you.
          </p>

          {slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-3">
              <select
                className="input flex-1"
                value={slot.dayOfWeek}
                onChange={(e) => updateSlot(index, "dayOfWeek", Number(e.target.value))}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                className="input w-32"
                value={slot.startTime}
                onChange={(e) => updateSlot(index, "startTime", e.target.value)}
              />
              <span className="text-slate-500 text-sm">to</span>
              <input
                type="time"
                className="input w-32"
                value={slot.endTime}
                onChange={(e) => updateSlot(index, "endTime", e.target.value)}
              />
              <button
                onClick={() => removeSlot(index)}
                className="text-red-400 hover:text-red-300 text-sm px-2 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={addSlot} className="btn-secondary text-sm">
              + Add time slot
            </button>
            <button
              onClick={saveAvailability}
              className="btn-primary text-sm"
              disabled={savingAvail}
            >
              {savingAvail ? "Saving…" : "Save availability"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
