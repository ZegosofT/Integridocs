// middleware.ts  (à la racine du projet Next.js, au même niveau que pages/)
import { NextRequest, NextResponse } from "next/server";

// Routes qui ne nécessitent PAS d'être connecté
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/verify-totp"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques et les assets statiques
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("integridocs_session");

  // Pas de cookie → redirection vers login
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier la session côté serveur FastAPI
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const check = await fetch(`${apiBase}/auth/me`, {
      headers: { Cookie: `integridocs_session=${sessionCookie.value}` },
    });

    if (!check.ok) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("integridocs_session");
      return res;
    }
  } catch {
    // Si le backend est down, on laisse passer (évite un reboot complet)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Appliquer le middleware sur toutes les routes SAUF les fichiers statiques
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
