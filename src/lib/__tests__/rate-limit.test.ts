import { afterEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows requests within the limit", () => {
		const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });

		const r1 = limiter.check("user-1");
		const r2 = limiter.check("user-1");
		const r3 = limiter.check("user-1");

		expect(r1.allowed).toBe(true);
		expect(r1.remaining).toBe(2);
		expect(r2.allowed).toBe(true);
		expect(r2.remaining).toBe(1);
		expect(r3.allowed).toBe(true);
		expect(r3.remaining).toBe(0);
	});

	it("blocks requests exceeding the limit", () => {
		const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60_000 });

		limiter.check("user-1");
		limiter.check("user-1");
		const r3 = limiter.check("user-1");

		expect(r3.allowed).toBe(false);
		expect(r3.remaining).toBe(0);
		expect(r3.retryAfterMs).toBeGreaterThan(0);
	});

	it("tracks users independently", () => {
		const limiter = new RateLimiter({ maxRequests: 1, windowMs: 60_000 });

		const r1 = limiter.check("user-a");
		const r2 = limiter.check("user-b");
		const r3 = limiter.check("user-a");

		expect(r1.allowed).toBe(true);
		expect(r2.allowed).toBe(true);
		expect(r3.allowed).toBe(false);
	});

	it("resets after the window expires", () => {
		vi.useFakeTimers();
		const windowMs = 10_000;
		const limiter = new RateLimiter({ maxRequests: 1, windowMs });

		const r1 = limiter.check("user-1");
		expect(r1.allowed).toBe(true);

		const r2 = limiter.check("user-1");
		expect(r2.allowed).toBe(false);

		// Advance past the window
		vi.advanceTimersByTime(windowMs + 1);

		const r3 = limiter.check("user-1");
		expect(r3.allowed).toBe(true);
	});
});
