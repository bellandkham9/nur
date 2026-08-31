import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/offline",
];

// ============================================================
// VÉRIFICATION JWT
// ============================================================

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token);

    if (!payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);

    return payload.exp <= now;
  } catch {
    return true;
  }
}

// ============================================================
// ROUTE PUBLIQUE
// ============================================================

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) =>
      pathname === path ||
      (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

// ============================================================
// REDIRECTION LOGIN
// ============================================================

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set(
    "next",
    request.nextUrl.pathname +
      request.nextUrl.search,
  );

  const response = NextResponse.redirect(loginUrl);

  response.cookies.delete("access_token");

  return response;
}

// ============================================================
// MIDDLEWARE
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================================
  // RESSOURCES INTERNES / STATIQUES
  // ==========================================================

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ==========================================================
  // ROUTES PUBLIQUES
  // ==========================================================

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ==========================================================
  // ROUTES PRIVÉES
  // ==========================================================

  const accessToken =
    request.cookies.get("access_token")?.value;

  // Aucun token
  if (!accessToken) {
    return redirectToLogin(request);
  }

  // Token invalide ou expiré
  if (isTokenExpired(accessToken)) {
    return redirectToLogin(request);
  }

  // ==========================================================
  // UTILISATEUR AUTHENTIFIÉ
  // ==========================================================

  const response = NextResponse.next();

  /*
   * IMPORTANT :
   *
   * On demande explicitement au navigateur et aux caches
   * intermédiaires de ne pas conserver les réponses privées.
   *
   * Cela ne remplace PAS la protection du middleware.
   * C'est une couche supplémentaire.
   */

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  return response;
}

// ============================================================
// CONFIGURATION
// ============================================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

