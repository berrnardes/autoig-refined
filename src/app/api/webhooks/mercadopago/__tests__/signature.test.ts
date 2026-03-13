import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * We test the webhook POST handler end-to-end by calling it with
 * a properly signed (or forged) request and asserting the response.
 */

const SECRET = "test-webhook-secret-key";

function sign(dataId: string, requestId: string, ts: string): string {
	const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
	const hash = createHmac("sha256", SECRET).update(manifest).digest("hex");
	return `ts=${ts},v1=${hash}`;
}

// Mock the credit service so we don't hit the DB
vi.mock("@/services/credit-service", () => ({
	handleWebhook: vi.fn().mockResolvedValue(undefined),
	CreditServiceError: class CreditServiceError extends Error {
		code: string;
		constructor(message: string, code: string) {
			super(message);
			this.code = code;
			this.name = "CreditServiceError";
		}
	},
}));

describe("Mercado Pago webhook signature verification", () => {
	beforeEach(() => {
		vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	async function importHandler() {
		// Re-import to pick up env changes — the module caches WEBHOOK_SECRET at import time,
		// so we need to reset modules each time.
		vi.resetModules();
		const mod = await import("../route");
		return mod.POST;
	}

	function makeRequest(opts: {
		body?: object;
		queryParams?: Record<string, string>;
		headers?: Record<string, string>;
	}) {
		const url = new URL("http://localhost:3000/api/webhooks/mercadopago");
		if (opts.queryParams) {
			for (const [k, v] of Object.entries(opts.queryParams)) {
				url.searchParams.set(k, v);
			}
		}

		return new Request(url.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(opts.headers ?? {}),
			},
			body: opts.body ? JSON.stringify(opts.body) : undefined,
		});
	}

	it("accepts a correctly signed webhook", async () => {
		const POST = await importHandler();
		const dataId = "12345";
		const requestId = "req-abc-123";
		const ts = String(Date.now());
		const xSignature = sign(dataId, requestId, ts);

		const req = makeRequest({
			body: { action: "payment.updated", data: { id: dataId } },
			queryParams: { "data.id": dataId },
			headers: {
				"x-signature": xSignature,
				"x-request-id": requestId,
			},
		});

		// NextRequest wraps the standard Request
		const { NextRequest } = await import("next/server");
		const nextReq = new NextRequest(req);
		const res = await POST(nextReq);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ received: true });
	});

	it("rejects a request with no signature", async () => {
		const POST = await importHandler();

		const req = makeRequest({
			body: { action: "payment.updated", data: { id: "12345" } },
			queryParams: { "data.id": "12345" },
		});

		const { NextRequest } = await import("next/server");
		const nextReq = new NextRequest(req);
		const res = await POST(nextReq);

		expect(res.status).toBe(401);
	});

	it("rejects a request with a tampered signature", async () => {
		const POST = await importHandler();
		const dataId = "12345";
		const requestId = "req-abc-123";
		const ts = String(Date.now());

		// Sign with a different secret
		const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
		const badHash = createHmac("sha256", "wrong-secret")
			.update(manifest)
			.digest("hex");

		const req = makeRequest({
			body: { action: "payment.updated", data: { id: dataId } },
			queryParams: { "data.id": dataId },
			headers: {
				"x-signature": `ts=${ts},v1=${badHash}`,
				"x-request-id": requestId,
			},
		});

		const { NextRequest } = await import("next/server");
		const nextReq = new NextRequest(req);
		const res = await POST(nextReq);

		expect(res.status).toBe(401);
	});

	it("rejects a request with a tampered data.id", async () => {
		const POST = await importHandler();
		const requestId = "req-abc-123";
		const ts = String(Date.now());

		// Sign for data.id "12345" but send "99999" in the query param
		const xSignature = sign("12345", requestId, ts);

		const req = makeRequest({
			body: { action: "payment.updated", data: { id: "99999" } },
			queryParams: { "data.id": "99999" },
			headers: {
				"x-signature": xSignature,
				"x-request-id": requestId,
			},
		});

		const { NextRequest } = await import("next/server");
		const nextReq = new NextRequest(req);
		const res = await POST(nextReq);

		expect(res.status).toBe(401);
	});
});
