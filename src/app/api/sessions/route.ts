// API route: POST /api/sessions
// Books a new tutoring session

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bookingSchema = z.object({
  tutorProfileId: z.string(),
  subject: z.string().min(1, "Subject is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  durationMinutes: z.number().min(30).max(120),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Make sure the user is logged in
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tutorProfileId, subject, scheduledDate, scheduledTime, durationMinutes, notes } =
      parsed.data;

    // Get the tutor profile to find the tutorId and hourly rate
    const tutorProfile = await db.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Prevent a tutor from booking themselves
    if (tutorProfile.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book yourself as a tutor" },
        { status: 400 }
      );
    }

    // Double-booking check: make sure the tutor doesn't already have
    // a PENDING or CONFIRMED session at the same date + time
    const conflict = await db.session.findFirst({
      where: {
        tutorProfileId,
        scheduledDate,
        scheduledTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "That time slot is already booked. Please choose another." },
        { status: 409 }
      );
    }

    // Calculate the total cost
    const hours = durationMinutes / 60;
    const totalCost = tutorProfile.hourlyRate * hours;

    // Create the session
    const newSession = await db.session.create({
      data: {
        studentId: session.user.id,
        tutorProfileId,
        tutorId: tutorProfile.userId,
        subject,
        scheduledDate,
        scheduledTime,
        durationMinutes,
        totalCost,
        notes: notes || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Could not create booking. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/sessions — get sessions for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "student";

    let sessions;

    if (role === "tutor") {
      sessions = await db.session.findMany({
        where: { tutorId: session.user.id },
        include: {
          student: { select: { name: true, email: true, university: true } },
          review: true,
        },
        orderBy: { scheduledDate: "desc" },
      });
    } else {
      sessions = await db.session.findMany({
        where: { studentId: session.user.id },
        include: {
          tutorProfile: {
            include: { user: { select: { name: true, university: true } } },
          },
          review: true,
        },
        orderBy: { scheduledDate: "desc" },
      });
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Could not load sessions" },
      { status: 500 }
    );
  }
}
