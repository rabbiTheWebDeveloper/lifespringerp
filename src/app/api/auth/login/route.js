import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getUserByEmail } from "@/queries/user-queries";

const JWT_SECRET = process.env.JWT_SECRET || "lifespring_jwt_erp_super_secret_key_2026";

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password, rememberMe = true } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email / ID / Phone and password are required." },
        { status: 400 }
      );
    }

    let user = null;
    let isDbConnected = false;

    try {
      user = await getUserByEmail(identifier);
      isDbConnected = true;
    } catch (dbErr) {
      console.warn("Database lookup failed or not connected, checking fallback:", dbErr.message);
    }

    // Demo/Development accounts fallback if DB is offline or user not yet in DB
    if (!user) {
      const demoAccounts = [
        {
          _id: "demo-admin-id",
          fullName: "Dr. Sayedul Ashraf",
          email: "admin@lifespringint.com",
          phone: "01711000111",
          role: "admin",
          designation: "Managing Director & Psychiatrist",
          permissions: ["*"],
          avatar: "",
        },
        {
          _id: "demo-doctor-id",
          fullName: "Dr. Fatima Rahman",
          email: "doctor@lifespringint.com",
          phone: "01711000222",
          role: "doctor",
          designation: "Consultant Psychiatrist",
          permissions: ["doctor-portal"],
          avatar: "",
        },
        {
          _id: "demo-patient-id",
          fullName: "Tanvir Ahmed",
          email: "patient@lifespringint.com",
          phone: "01711000333",
          role: "patient",
          designation: "Registered Patient",
          permissions: ["patient-portal"],
          avatar: "",
        },
      ];

      const cleanIdentifier = String(identifier).toLowerCase().trim();
      const demoMatch = demoAccounts.find(
        (a) =>
          a.email.toLowerCase() === cleanIdentifier ||
          a.email.replace("@lifespringint.com", "@lifespring.com").toLowerCase() === cleanIdentifier ||
          a.phone === cleanIdentifier ||
          cleanIdentifier === a.role
      );

      if (demoMatch && (password === "123456" || password === "password" || password === "admin123")) {
        user = demoMatch;
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please verify your Email/Phone and password." },
        { status: 401 }
      );
    }

    // If user has a real password stored (from DB)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials. Please check your password." },
          { status: 401 }
        );
      }
    }

    const { password: _, resetPasswordToken: __, ...safeUser } = user;

    // Determine redirect destination based on role
    let redirectUrl = "/";
    if (safeUser.role === "doctor") redirectUrl = "/doctor";
    else if (safeUser.role === "patient") redirectUrl = "/patient";
    else if (safeUser.role === "teacher") redirectUrl = "/teacher-portal";
    else if (safeUser.role === "student") redirectUrl = "/student-portal";

    // Generate JWT token
    const token = jwt.sign(
      {
        id: safeUser._id,
        email: safeUser.email,
        role: safeUser.role || "admin",
        fullName: safeUser.fullName,
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "1d" }
    );

    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      path: "/",
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set("auth_token", token, {
      path: "/",
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set("role", safeUser.role || "admin", {
      path: "/",
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set("user", JSON.stringify(safeUser), {
      path: "/",
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser,
      role: safeUser.role || "admin",
      redirectUrl,
    });

    // Also attach cookies on the response headers
    response.cookies.set("token", token, { path: "/", maxAge, sameSite: "lax" });
    response.cookies.set("auth_token", token, { path: "/", maxAge, sameSite: "lax" });
    response.cookies.set("role", safeUser.role || "admin", { path: "/", maxAge, sameSite: "lax" });
    response.cookies.set("user", JSON.stringify(safeUser), { path: "/", maxAge, sameSite: "lax" });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
