// API route: PATCH /api/sessions/[id]
// Updates a session status (confirm, cancel, complete)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason } = body;

    // Find the session
    const bookingSession = await db.session.findUnique({
      where: { id },
    });

    if (!bookingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only the tutor can confirm sessions
    if (status === "CONFIRMED" && bookingSession.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the tutor can confirm sessions" },
        { status: 403 }
      );
    }

    // Only the tutor can mark sessions as complete
    if (status === "COMPLETED" && bookingSession.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the tutor can mark sessions complete" },
        { status: 403 }
      );
    }

    // Either the student or tutor can cancel
    if (
      status === "CANCELLED" &&
      bookingSession.studentId !== session.user.id &&
      bookingSession.tutorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not part of this session" },
        { status: 403 }
      );
    }

    const updated = await db.session.update({
      where: { id },
      data: {
        status,
        ...(cancelReason && { cancelReason }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Could not update session" },
      { status: 500 }
    );
  }
}
