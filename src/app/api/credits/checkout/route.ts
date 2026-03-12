import { auth } from "@/lib/auth";
import {
	createPixPayment,
	CreditServiceError,
} from "@/services/credit-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
	quantity: z.number().int().min(1).max(100),
});

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = checkoutSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	try {
		const pix = await createPixPayment(
			session.user.id,
			session.user.email,
			parsed.data.quantity,
		);
		return NextResponse.json(pix);
	} catch (err) {
		console.error("Checkout error:", err);
		if (err instanceof CreditServiceError) {
			return NextResponse.json(
				{ error: err.message, code: err.code },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
