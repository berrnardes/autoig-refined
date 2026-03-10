import {
	constructWebhookEvent,
	CreditServiceError,
	handleWebhook,
} from "@/services/credit-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const signature = request.headers.get("stripe-signature");

	console.log(request.body);

	if (!signature) {
		return NextResponse.json(
			{ error: "Missing stripe-signature header" },
			{ status: 400 },
		);
	}

	let payload: string;
	try {
		payload = await request.text();
	} catch {
		return NextResponse.json(
			{ error: "Failed to read request body" },
			{ status: 400 },
		);
	}

	try {
		const event = constructWebhookEvent(payload, signature);
		await handleWebhook(event);
		return NextResponse.json({ received: true });
	} catch (err) {
		if (err instanceof CreditServiceError) {
			const status = err.code === "WEBHOOK_ERROR" ? 400 : 500;
			return NextResponse.json({ error: err.message }, { status });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
