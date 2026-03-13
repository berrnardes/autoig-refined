import { auth } from "@/lib/auth";
import { evaluationLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { createEvaluationSchema } from "@/lib/validators";
import {
	evaluationService,
	EvaluationServiceError,
} from "@/services/evaluation-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { allowed, retryAfterMs } = evaluationLimiter.check(session.user.id);
	if (!allowed) return rateLimitResponse(retryAfterMs);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = createEvaluationSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	try {
		const evaluation = await evaluationService.createEvaluation(
			session.user.id,
			parsed.data.username,
			parsed.data.competitors,
		);
		// Returns immediately with a pending evaluation.
		// The pipeline runs in the background; client polls GET /evaluations/:id.
		return NextResponse.json(evaluation, { status: 202 });
	} catch (err) {
		if (err instanceof EvaluationServiceError) {
			if (err.code === "INSUFFICIENT_CREDITS") {
				return NextResponse.json(
					{ error: err.message, code: err.code },
					{ status: 402 },
				);
			}
			return NextResponse.json(
				{ error: err.message, code: err.code },
				{ status: 500 },
			);
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const evaluations = await evaluationService.listEvaluations(
			session.user.id,
		);
		return NextResponse.json(evaluations);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
