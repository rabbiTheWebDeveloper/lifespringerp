import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookieNames = ["token", "auth_token", "user", "role", "student_token", "student_user"];
    
    for (const name of cookieNames) {
      cookieStore.delete(name);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Also set expired headers directly on the response for immediate browser purge
    for (const name of cookieNames) {
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, message: "Error during logout" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
