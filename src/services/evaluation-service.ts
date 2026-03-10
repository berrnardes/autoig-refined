/**
 * Evaluation orchestrator — coordinates the full profile evaluation pipeline:
 * credit deduction, profile scraping, competitor analysis, guide generation,
 * quality judging, and optional regeneration. Handles refunds on failure.
 */

import { db } from "@/db";
import { evaluations } from "@/db/schema";
import type {
	CompetitorData,
	Evaluation,
	EvaluationStatus,
	GuideContent,
	ProfileData,
} from "@/types";
import { desc, eq } from "drizzle-orm";
import { competitorService } from "./competitor-service";
import {
	CreditServiceError,
	deductCredit,
	refundCredit,
} from "./credit-service";
import * as guideService from "./guide-service";
import * as judgeService from "./judge-service";
import { scrapeService } from "./scrape-service";

const REGENERATION_THRESHOLD = 60;

export class EvaluationServiceError extends Error {
	constructor(
		message: string,
		public readonly code:
			| "INSUFFICIENT_CREDITS"
			| "SCRAPE_FAILED"
			| "GUIDE_FAILED"
			| "JUDGE_FAILED"
			| "NOT_FOUND"
			| "INTERNAL_ERROR",
	) {
		super(message);
		this.name = "EvaluationServiceError";
	}
}

/**
 * Update the status of an evaluation record.
 */
async function updateStatus(
	evaluationId: string,
	status: EvaluationStatus,
	extra?: Partial<{
		guideContent: GuideContent;
		qualityScore: number;
	}>,
) {
	await db
		.update(evaluations)
		.set({ status, updatedAt: new Date(), ...extra })
		.where(eq(evaluations.id, evaluationId));
}

/**
 * Map a DB row to the Evaluation interface.
 */
function toEvaluation(row: typeof evaluations.$inferSelect): Evaluation {
	return {
		id: row.id,
		userId: row.userId,
		username: row.username,
		competitors: row.competitors,
		guideContent: row.guideContent ?? null,
		qualityScore: row.qualityScore ?? null,
		status: row.status as EvaluationStatus,
		createdAt: row.createdAt.toISOString(),
	};
}

export const evaluationService = {
	/**
	 * Orchestrate the full evaluation pipeline:
	 * verify credit → deduct → scrape user → scrape competitors →
	 * generate guide → judge → (regenerate if < 60) → store result.
	 *
	 * On any failure after credit deduction, refunds the credit.
	 */
	async createEvaluation(
		userId: string,
		username: string,
		competitors: string[],
	): Promise<Evaluation> {
		// 1. Create evaluation record in pending state
		const [row] = await db
			.insert(evaluations)
			.values({
				userId,
				username,
				competitors,
				status: "pending",
			})
			.returning();

		const evalId = row.id;
		let creditDeducted = false;

		try {
			// 2. Deduct credit
			await deductCredit(userId);
			creditDeducted = true;

			// 3. Scrape user profile
			await updateStatus(evalId, "scraping");
			let profileData: ProfileData;
			try {
				profileData = await scrapeService.scrapeProfile(username);
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to scrape profile "${username}": ${err instanceof Error ? err.message : String(err)}`,
					"SCRAPE_FAILED",
				);
			}

			// 4. Scrape and analyze competitors
			await updateStatus(evalId, "analyzing");
			let competitorData: CompetitorData;
			try {
				competitorData =
					await competitorService.analyzeCompetitors(competitors);
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to analyze competitors: ${err instanceof Error ? err.message : String(err)}`,
					"SCRAPE_FAILED",
				);
			}

			// 5. Generate guide
			await updateStatus(evalId, "generating");
			let guide: GuideContent;
			try {
				guide = await guideService.generateGuide(profileData, competitorData);
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to generate guide: ${err instanceof Error ? err.message : String(err)}`,
					"GUIDE_FAILED",
				);
			}

			// 6. Judge guide
			await updateStatus(evalId, "judging");
			let judgeResult: { score: number; feedback: string };
			try {
				judgeResult = await judgeService.evaluateGuide(guide);
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to evaluate guide quality: ${err instanceof Error ? err.message : String(err)}`,
					"JUDGE_FAILED",
				);
			}

			// 7. Regenerate if score < threshold
			if (judgeResult.score < REGENERATION_THRESHOLD) {
				try {
					guide = await guideService.regenerateGuide(
						profileData,
						competitorData,
						judgeResult.feedback,
					);
					judgeResult = await judgeService.evaluateGuide(guide);
				} catch {
					// Store whatever we have — the first guide is still usable
				}
			}

			// 8. Store final result
			await updateStatus(evalId, "completed", {
				guideContent: guide,
				qualityScore: judgeResult.score,
			});

			return toEvaluation({
				...row,
				guideContent: guide,
				qualityScore: judgeResult.score,
				status: "completed",
				updatedAt: new Date(),
			});
		} catch (err) {
			// Refund credit if it was deducted
			if (creditDeducted) {
				try {
					await refundCredit(userId);
				} catch {
					// Log but don't mask the original error
				}
			}

			await updateStatus(evalId, "failed");

			if (err instanceof CreditServiceError) {
				throw new EvaluationServiceError(err.message, "INSUFFICIENT_CREDITS");
			}
			if (err instanceof EvaluationServiceError) {
				throw err;
			}
			throw new EvaluationServiceError(
				`Evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
				"INTERNAL_ERROR",
			);
		}
	},

	/**
	 * Get a single evaluation by ID.
	 */
	async getEvaluation(evaluationId: string): Promise<Evaluation> {
		const [row] = await db
			.select()
			.from(evaluations)
			.where(eq(evaluations.id, evaluationId))
			.limit(1);

		if (!row) {
			throw new EvaluationServiceError(
				`Evaluation "${evaluationId}" not found`,
				"NOT_FOUND",
			);
		}

		return toEvaluation(row);
	},

	/**
	 * List all evaluations for a user, newest first.
	 */
	async listEvaluations(userId: string): Promise<Evaluation[]> {
		const rows = await db
			.select()
			.from(evaluations)
			.where(eq(evaluations.userId, userId))
			.orderBy(desc(evaluations.createdAt));

		return rows.map(toEvaluation);
	},
};
