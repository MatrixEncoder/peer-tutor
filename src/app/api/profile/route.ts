// API route: GET/PUT /api/profile
// Get and update the logged-in user's profile

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  university: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  yearOfStudy: z.number().min(1).max(6).optional(),
  // Tutor-specific fields
  hourlyRate: z.number().min(0).optional(),
  subjects: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        tutorProfile: {
          include: { availability: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't send the password back to the client
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { hourlyRate, subjects, ...userFields } = parsed.data;

    // Update user fields
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: userFields,
    });

    // If tutor fields were provided, update the tutor profile
    if (hourlyRate !== undefined || subjects !== undefined) {
      await db.tutorProfile.upsert({
        where: { userId: session.user.id },
        update: {
          ...(hourlyRate !== undefined && { hourlyRate }),
          ...(subjects !== undefined && { subjects }),
        },
        create: {
          userId: session.user.id,
          hourlyRate: hourlyRate || 0,
          subjects: subjects || "",
        },
      });
    }

    const { password, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
