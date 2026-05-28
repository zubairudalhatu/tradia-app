import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "tradia_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

type AdminActionPayload = SessionPayload & {
  role: string;
};

export async function createSession(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${encodedPayload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    domain: getCookieDomain()
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  const domain = getCookieDomain();

  if (domain) {
    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
      domain
    });
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verify(token);

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];

  if (!allowedRoles.includes(user.role)) {
    throw new Error("You do not have permission to access this area.");
  }

  return user;
}

export function createAdminActionToken(user: { id: string; role: string }) {
  const payload: AdminActionPayload = {
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + 15 * 60 * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function getAdminFromActionToken(token?: string) {
  const payload = verifyAdminActionToken(token);

  if (!payload || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(payload.role)) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true
    }
  });

  if (!user || user.status !== "ACTIVE" || user.role !== payload.role) return null;

  return user;
}

function verify(token?: string): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function verifyAdminActionToken(token?: string): AdminActionPayload | null {
  const payload = verify(token) as AdminActionPayload | null;

  if (!payload?.role) return null;

  return payload;
}

function sign(value: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "development-secret")
    .update(value)
    .digest("base64url");
}

function getCookieDomain() {
  if (process.env.NODE_ENV !== "production") return undefined;

  try {
    const hostname = new URL(process.env.NEXTAUTH_URL ?? "").hostname;

    if (hostname === "tradia.business" || hostname.endsWith(".tradia.business")) {
      return ".tradia.business";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
