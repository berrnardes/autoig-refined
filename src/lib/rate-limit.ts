/**
 * In-memory sliding-window rate limiter.
 *
 * Each limiter instance tracks request timestamps per key (typically userId).
 * Zero dependencies — works in any Node.js serverless or long-running environment.
 *
 * Note: In a multi-instance deployment (e.g. multiple serverless containers),
 * each instance has its own window. This is acceptable for per-user throttling
 * since the credit system is the true budget gate — this just prevents abuse bursts.
 */

import { NextResponse } from "next/server";

interface RateLimitConfig {
	/** Max requests allowed within the window */
	maxRequests: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

interface RateLimitEntry {
	timestamps: number[];
}

export class RateLimiter {
	private store = new Map<string, RateLimitEntry>();
	private readonly config: RateLimitConfig;
	private cleanupTimer: ReturnType<typeof setInterval>;

	constructor(config: RateLimitConfig) {
		this.config = config;
		// Periodically evict stale entries to prevent memory leaks
		this.cleanupTimer = setInterval(
			() => this.cleanup(),
			Math.max(config.windowMs * 2, 60_000),
		);
		// Allow the process to exit without waiting for this timer
		if (this.cleanupTimer.unref) this.cleanupTimer.unref();
	}

	/**
	 * Check if a key (userId) is within the rate limit.
	 * Returns { allowed, remaining, retryAfterMs }.
	 */
	check(key: string): {
		allowed: boolean;
		remaining: number;
		retryAfterMs: number;
	} {
		const now = Date.now();
		const windowStart = now - this.config.windowMs;

		let entry = this.store.get(key);
		if (!entry) {
			entry = { timestamps: [] };
			this.store.set(key, entry);
		}

		// Drop timestamps outside the current window
		entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

		if (entry.timestamps.length >= this.config.maxRequests) {
			const oldestInWindow = entry.timestamps[0];
			const retryAfterMs = oldestInWindow + this.config.windowMs - now;
			return {
				allowed: false,
				remaining: 0,
				retryAfterMs: Math.max(retryAfterMs, 0),
			};
		}

		entry.timestamps.push(now);
		return {
			allowed: true,
			remaining: this.config.maxRequests - entry.timestamps.length,
			retryAfterMs: 0,
		};
	}

	private cleanup() {
		const now = Date.now();
		const windowStart = now - this.config.windowMs;
		for (const [key, entry] of this.store) {
			entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
			if (entry.timestamps.length === 0) this.store.delete(key);
		}
	}
}

/**
 * Pre-configured limiters for the expensive endpoints.
 *
 * evaluations: 3 requests per 5 minutes per user
 *   (each evaluation = Apify scraping + multiple OpenAI calls)
 *
 * checkout: 5 requests per 5 minutes per user
 *   (each checkout = Mercado Pago API call)
 */
export const evaluationLimiter = new RateLimiter({
	maxRequests: 3,
	windowMs: 5 * 60 * 1000,
});

export const checkoutLimiter = new RateLimiter({
	maxRequests: 5,
	windowMs: 5 * 60 * 1000,
});

/**
 * Helper to return a standardized 429 response with Retry-After header.
 */
export function rateLimitResponse(retryAfterMs: number): NextResponse {
	const retryAfterSec = Math.ceil(retryAfterMs / 1000);
	return NextResponse.json(
		{
			error: "Too many requests. Please try again later.",
			code: "RATE_LIMITED",
		},
		{
			status: 429,
			headers: { "Retry-After": String(retryAfterSec) },
		},
	);
}
