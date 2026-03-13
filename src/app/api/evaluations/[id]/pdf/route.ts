import { auth } from "@/lib/auth";
import {
	evaluationService,
	EvaluationServiceError,
} from "@/services/evaluation-service";
import * as guideService from "@/services/guide-service";
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

		if (!evaluation.guideContent) {
			return NextResponse.json(
				{ error: "Guide not yet available for this evaluation" },
				{ status: 404 },
			);
		}

		const pdfBuffer = await guideService.generatePdf(evaluation.guideContent);

		return new NextResponse(new Uint8Array(pdfBuffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="guide-${evaluation.username}.pdf"`,
				"Content-Length": String(pdfBuffer.length),
			},
		});
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
