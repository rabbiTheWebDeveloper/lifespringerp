import jwt from "jsonwebtoken";
import { dbConnect } from "@/service/mongo";
import { UserModel } from "@/model/user-model";
import { StaffModel } from "@/model/staff-model";
import { RoleModel } from "@/model/role-model";

const SYSTEM_ROLES_PERMISSIONS = {
  "super-admin": ["*"],
  "admin": ["*"],
  "teacher": ["teacher-portal"],
  "student": ["student-portal"],
  "staff": ["staff-portal"],
};

// ── In-Memory Session Cache (30s TTL) ─────────────────────────────────────────
// Eliminates repetitive DB round-trips on rapid user interactions
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 30 * 1000;

function getCachedSession(token) {
  const cached = sessionCache.get(token);
  if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL_MS) {
    return cached.user;
  }
  if (cached) sessionCache.delete(token);
  return null;
}

function setCachedSession(token, user) {
  // Cap map size to prevent unbounded memory growth
  if (sessionCache.size > 2000) {
    sessionCache.clear();
  }
  sessionCache.set(token, { user, timestamp: Date.now() });
}

/**
 * Extract authenticated user from cookies or Authorization Bearer header
 */
export async function getAuthenticatedUser(request) {
  try {
    let token = null;

    // 1. Check Cookie header from request
    const cookieHeader = request?.headers?.get("cookie") || "";
    const authCookieMatch = cookieHeader.match(/(?:^|;\s*)(?:auth_token|token)=([^;]+)/);
    if (authCookieMatch?.[1]) {
      token = decodeURIComponent(authCookieMatch[1]);
    }

    // 2. Check Authorization header
    if (!token && request?.headers?.get("authorization")) {
      const authHeader = request.headers.get("authorization");
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Fallback to Next.js cookie store
    if (!token) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        token =
          cookieStore.get("auth_token")?.value ||
          cookieStore.get("token")?.value;
      } catch {
        // Ignore next/headers error if not supported in current context
      }
    }

    if (!token) return null;

    // Check fast in-memory cache first (0ms overhead)
    const cachedUser = getCachedSession(token);
    if (cachedUser) return cachedUser;

    let decoded = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      try {
        decoded = jwt.decode(token);
      } catch {
        return null;
      }
    }

    if (!decoded || (!decoded.id && !decoded._id && !decoded.email)) {
      return null;
    }

    const userId = decoded.id || decoded._id;
    const userEmail = (decoded.email || "").toLowerCase().trim();

    await dbConnect();

    // 4. Look up user across models: UserModel, StaffModel, TeacherModel
    let user = null;

    if (userId) {
      user = await UserModel.findById(userId)
        .select("-password -resetPasswordToken")
        .lean({ virtuals: false });

      if (!user) {
        user = await StaffModel.findById(userId)
          .select("-password -resetPasswordToken")
          .lean({ virtuals: false });
      }

      if (!user) {
        try {
          const { TeacherModel } = await import("@/model/teacher-model");
          user = await TeacherModel.findById(userId)
            .select("-password -resetPasswordToken")
            .lean({ virtuals: false });
        } catch {}
      }
    }

    // Fallback lookup by email if not found by ID
    if (!user && userEmail) {
      user = await UserModel.findOne({ email: userEmail })
        .select("-password -resetPasswordToken")
        .lean({ virtuals: false });

      if (!user) {
        user = await StaffModel.findOne({ email: userEmail })
          .select("-password -resetPasswordToken")
          .lean({ virtuals: false });
      }

      if (!user) {
        try {
          const { TeacherModel } = await import("@/model/teacher-model");
          user = await TeacherModel.findOne({ email: userEmail })
            .select("-password -resetPasswordToken")
            .lean({ virtuals: false });
        } catch {}
      }
    }

    // Fallback: build from decoded token payload
    if (!user) {
      user = {
        _id: userId,
        id: userId,
        email: userEmail,
        fullName: decoded.fullName || decoded.name || "User",
        role: decoded.role || "staff",
      };
    }

    // Resolve permissions
    const role = user.role || decoded.role || "staff";
    let permissions = [];
    if (role === "super-admin" || user.permissions?.includes("*")) {
      permissions = ["*"];
    } else if (SYSTEM_ROLES_PERMISSIONS[role]) {
      permissions = SYSTEM_ROLES_PERMISSIONS[role];
    } else {
      const roleDoc = await RoleModel.findOne({ name: role }).lean({ virtuals: false });
      permissions = roleDoc?.permissions || user.permissions || [];
    }

    user.permissions = permissions;
    user.role = role;
    if (!user.email && userEmail) user.email = userEmail;

    // Cache the resolved session for 30s
    setCachedSession(token, user);

    return user;
  } catch (err) {
    console.warn("[getAuthenticatedUser] Auth check failed:", err.message);
    return null;
  }
}
