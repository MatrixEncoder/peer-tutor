// API route: POST /api/register
// Creates a new user account

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schema for the registration form
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().min(2, "University name is required"),
  department: z.string().min(2, "Department is required"),
  yearOfStudy: z.number().min(1).max(6),
  role: z.enum(["STUDENT", "TUTOR", "BOTH"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the incoming data
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, university, department, yearOfStudy, role } =
      parsed.data;

    // Check if email is already taken
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 400 }
      );
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        university,
        department,
        yearOfStudy,
        role,
      },
    });

    // If registering as a tutor (or both), create the tutor profile too
    if (role === "TUTOR" || role === "BOTH") {
      await db.tutorProfile.create({
        data: {
          userId: user.id,
          subjects: "",
          hourlyRate: 0,
        },
      });
    }

    return NextResponse.json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
