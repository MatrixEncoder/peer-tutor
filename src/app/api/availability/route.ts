// API route: PUT /api/availability
// Replaces the tutor's weekly availability schedule

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

const availabilitySchema = z.object({
  slots: z.array(slotSchema),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Make sure the user has a tutor profile
    const tutorProfile = await db.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "You need a tutor profile to set availability" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid availability data" },
        { status: 400 }
      );
    }

    // Delete existing slots and replace with new ones
    await db.availability.deleteMany({
      where: { tutorProfileId: tutorProfile.id },
    });

    if (parsed.data.slots.length > 0) {
      await db.availability.createMany({
        data: parsed.data.slots.map((slot) => ({
          tutorProfileId: tutorProfile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
    }

    return NextResponse.json({ message: "Availability updated" });
  } catch (error) {
    console.error("Availability update error:", error);
    return NextResponse.json(
      { error: "Could not update availability" },
      { status: 500 }
    );
  }
}
