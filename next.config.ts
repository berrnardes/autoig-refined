import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const securityHeaders = [
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "Content-Security-Policy",
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https:",
			"font-src 'self' data:",
			"connect-src 'self' https:",
			"frame-ancestors 'self'",
			"base-uri 'self'",
			"form-action 'self'",
		].join("; "),
	},
];

const nextConfig: NextConfig = {
	serverExternalPackages: ["apify-client"],
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }];
	},
};

export default withSentryConfig(nextConfig, {
	// Suppresses source map uploading logs during build
	silent: true,
	// Upload larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,
	// Hides source maps from generated client bundles
	sourcemaps: { deleteSourcemapsAfterUpload: true },

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,
});
