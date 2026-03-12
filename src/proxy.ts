import {
	DEFAULT_LOGIN_REDIRECT,
	apiAuthPrefix,
	apiWebhooksPrefix,
	authRoutes,
	publicRoutes,
} from "@/routes";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isLoggedIn = !!getSessionCookie(request);

	const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
	const isApiWebhookRoute = pathname.startsWith(apiWebhooksPrefix);
	const isPublicRoute = publicRoutes.includes(pathname);
	const isAuthRoute = authRoutes.includes(pathname);

	// Always allow auth API and webhook routes
	if (isApiAuthRoute || isApiWebhookRoute) {
		return NextResponse.next();
	}

	// Redirect logged-in users away from auth pages (login/signup)
	if (isAuthRoute) {
		if (isLoggedIn) {
			return NextResponse.redirect(
				new URL(DEFAULT_LOGIN_REDIRECT, request.url),
			);
		}
		return NextResponse.next();
	}

	// Allow public routes for everyone
	if (isPublicRoute) {
		return NextResponse.next();
	}

	// Everything else requires authentication
	if (!isLoggedIn) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
};
