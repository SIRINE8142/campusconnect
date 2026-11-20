import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Pages accessibles sans session.
const PUBLIC_PATHS = ["/", "/login", "/register"];

/**
 * Proxy Next.js 16 (ex-middleware) : première ligne de défense.
 * Il vérifie seulement la présence du cookie de session (la base de
 * données n'est pas accessible ici). La vraie vérification — session
 * valide ET rôle — est faite par requireUser()/requireAdmin() dans
 * les layouts et les Server Actions.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // On exclut les assets et les fichiers statiques.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
