import { NextRequest, NextResponse } from "next/server";

const VALID_SLUGS = ["sarah", "mark", "lisa"];

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userParam = searchParams.get("user");
  const hoursParam = searchParams.get("hours");

  // Only act if simulation params are present
  if (!userParam && !hoursParam) return NextResponse.next();

  // Read existing sim cookie
  const rawCookie = request.cookies.get("sim")?.value;
  let current = { userSlug: "sarah", hoursUntilLock: null as number | null };

  if (rawCookie) {
    try {
      const parsed = JSON.parse(rawCookie);
      current = {
        userSlug: VALID_SLUGS.includes(parsed.userSlug)
          ? parsed.userSlug
          : "sarah",
        hoursUntilLock:
          typeof parsed.hoursUntilLock === "number"
            ? parsed.hoursUntilLock
            : null,
      };
    } catch {
      // keep defaults
    }
  }

  // Merge overrides
  if (userParam && VALID_SLUGS.includes(userParam)) {
    current.userSlug = userParam;
  }
  if (hoursParam) {
    const hours = parseFloat(hoursParam);
    if (!isNaN(hours) && hours >= 0) {
      current.hoursUntilLock = hours;
    }
  }

  // Strip sim params and redirect
  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete("user");
  cleanUrl.searchParams.delete("hours");

  const response = NextResponse.redirect(cleanUrl);
  response.cookies.set("sim", JSON.stringify(current), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
