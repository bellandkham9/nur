import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  decodeJwt,
} from "jose";


// ============================================================
// ROUTES PUBLIQUES
// ============================================================

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/offline",
];


// ============================================================
// VÉRIFICATION JWT
// ============================================================

function isTokenExpired(
  token: string
): boolean {

  try {

    const payload =
      decodeJwt(token);


    if (!payload.exp) {

      return true;
    }


    const now =
      Math.floor(
        Date.now() / 1000
      );


    return payload.exp <= now;

  } catch {

    return true;
  }
}


// ============================================================
// MIDDLEWARE
// ============================================================

export function middleware(
  request: NextRequest
) {

  const { pathname } =
    request.nextUrl;


  // ==========================================================
  // ROUTES STATIQUES
  // ==========================================================

  if (

    pathname.startsWith(
      "/_next"
    ) ||

    pathname.startsWith(
      "/api"
    ) ||

    pathname.includes(".")
  ) {

    return NextResponse.next();
  }


  // ==========================================================
  // ROUTES PUBLIQUES
  // ==========================================================

  const isPublicPath =
    PUBLIC_PATHS.some(
      (path) =>

        pathname === path ||

        pathname.startsWith(
          `${path}/`
        )
    );


  if (isPublicPath) {

    return NextResponse.next();
  }


  // ==========================================================
  // TOKEN
  // ==========================================================

  const accessToken =
    request.cookies.get(
      "access_token"
    )?.value;


  // Aucun token

  if (!accessToken) {

    return redirectToLogin(
      request
    );
  }


  // ==========================================================
  // TOKEN EXPIRÉ
  // ==========================================================

  if (
    isTokenExpired(
      accessToken
    )
  ) {

    const response =
      redirectToLogin(
        request
      );


    // Supprime cookie expiré

    response.cookies.delete(
      "access_token"
    );


    return response;
  }


  // ==========================================================
  // TOKEN VALIDE
  // ==========================================================

  return NextResponse.next();
}


// ============================================================
// REDIRECTION LOGIN
// ============================================================

function redirectToLogin(
  request: NextRequest
) {

  const loginUrl =
    new URL(
      "/login",
      request.url
    );


  loginUrl.searchParams.set(
    "next",
    request.nextUrl.pathname
  );


  return NextResponse.redirect(
    loginUrl
  );
}


// ============================================================
// CONFIG
// ============================================================

export const config = {

  matcher: [

    "/((?!_next/static|_next/image|favicon.ico).*)",

  ],

};