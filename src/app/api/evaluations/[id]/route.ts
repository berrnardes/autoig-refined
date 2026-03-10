import { auth } from "@/lib/auth";
import {
	evaluationService,
	EvaluationServiceError,
} from "@/services/evaluation-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	try {
		const evaluation = await evaluationService.getEvaluation(id);

		if (evaluation.userId !== session.user.id) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json(evaluation);
	} catch (err) {
		if (err instanceof EvaluationServiceError && err.code === "NOT_FOUND") {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
