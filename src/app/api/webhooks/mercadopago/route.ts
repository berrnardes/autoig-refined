import { CreditServiceError, handleWebhook } from "@/services/credit-service";
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

/**
 * Verify the x-signature header sent by Mercado Pago.
 *
 * Mercado Pago signs webhooks using HMAC-SHA256 with a manifest string:
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * The x-signature header looks like:
 *   ts=1704908010,v1=618c853...
 *
 * @see https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 */
function verifySignature(
	dataId: string,
	xSignature: string | null,
	xRequestId: string | null,
): boolean {
	if (!WEBHOOK_SECRET || !xSignature || !xRequestId) return false;

	// Parse ts and v1 from "ts=...,v1=..."
	let ts: string | null = null;
	let hash: string | null = null;

	for (const part of xSignature.split(",")) {
		const [key, ...rest] = part.split("=");
		const value = rest.join("=").trim();
		if (key.trim() === "ts") ts = value;
		if (key.trim() === "v1") hash = value;
	}

	if (!ts || !hash) return false;

	// Build the manifest exactly as Mercado Pago documents it
	const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

	const expected = createHmac("sha256", WEBHOOK_SECRET)
		.update(manifest)
		.digest("hex");

	// Constant-time comparison to prevent timing attacks
	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
	} catch {
		return false;
	}
}

/**
 * Mercado Pago webhook handler.
 *
 * Accepts both the newer JSON body format and the legacy IPN query-param format.
 * Validates the x-signature HMAC before processing any payment.
 */
export async function POST(request: NextRequest) {
	let paymentId: string | null = null;

	// Try JSON body first (newer webhook format)
	try {
		const body = await request.json();
		if (body?.data?.id) {
			paymentId = String(body.data.id);
		}
	} catch {
		// Fall back to query params (IPN format)
	}

	// Fallback: legacy IPN query params (?type=payment&data.id=12345)
	if (!paymentId) {
		const type = request.nextUrl.searchParams.get("type");
		const dataId = request.nextUrl.searchParams.get("data.id");
		if (type === "payment" && dataId) {
			paymentId = dataId;
		}
	}

	if (!paymentId) {
		return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
	}

	// --- Signature verification ---
	const xSignature = request.headers.get("x-signature");
	const xRequestId = request.headers.get("x-request-id");

	// Also check query param data.id for the manifest (MP sends it there)
	const dataIdForSignature =
		request.nextUrl.searchParams.get("data.id") ?? paymentId;

	if (!verifySignature(dataIdForSignature, xSignature, xRequestId)) {
		console.warn(
			`Webhook signature verification failed for payment ${paymentId}`,
		);
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	try {
		await handleWebhook(paymentId);
		return NextResponse.json({ received: true });
	} catch (err) {
		console.error("Webhook error:", err);
		if (err instanceof CreditServiceError) {
			// Return 200 so Mercado Pago doesn't keep retrying for known errors
			return NextResponse.json({ error: err.message });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
