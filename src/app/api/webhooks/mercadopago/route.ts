import { CreditServiceError, handleWebhook } from "@/services/credit-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * Mercado Pago sends IPN notifications as POST with query params:
 * ?type=payment&data.id=12345
 * Or as JSON body: { action: "payment.updated", data: { id: "12345" } }
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

	try {
		await handleWebhook(paymentId);
		return NextResponse.json({ received: true });
	} catch (err) {
		console.error("Webhook error:", err);
		if (err instanceof CreditServiceError) {
			// Always return 200 so Mercado Pago doesn't keep retrying
			return NextResponse.json({ error: err.message });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
