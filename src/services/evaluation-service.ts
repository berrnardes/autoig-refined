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
	 * Create an evaluation record, deduct credit, and kick off the pipeline
	 * in the background. Returns immediately with the pending evaluation so
	 * the HTTP response is fast. The client polls GET /evaluations/:id for
	 * progress updates.
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

		// 2. Deduct credit (synchronous — fast DB operation, must fail before we start work)
		try {
			await deductCredit(userId);
		} catch (err) {
			await updateStatus(row.id, "failed");
			if (err instanceof CreditServiceError) {
				throw new EvaluationServiceError(err.message, "INSUFFICIENT_CREDITS");
			}
			throw new EvaluationServiceError(
				`Credit deduction failed: ${err instanceof Error ? err.message : String(err)}`,
				"INTERNAL_ERROR",
			);
		}

		// 3. Fire off the pipeline in the background — don't await
		this.runPipeline(row.id, userId, username, competitors).catch(() => {
			// Pipeline handles its own error/refund logic; this catch
			// prevents unhandled-rejection noise in the runtime.
		});

		return toEvaluation(row);
	},

	/**
	 * Run the heavy evaluation pipeline (scrape → analyze → generate → judge).
	 * Updates the evaluation status at each step. Refunds credit on failure.
	 * Designed to run in the background after the HTTP response is sent.
	 */
	async runPipeline(
		evalId: string,
		userId: string,
		username: string,
		competitors: string[],
	): Promise<void> {
		try {
			// Scrape user profile
			await updateStatus(evalId, "scraping");
			let profileData: ProfileData;
			try {
				profileData = await scrapeService.scrapeProfile(username, false, {
					addParentData: false,
					resultsType: "details",
					resultsLimit: 10,
				});
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to scrape profile "${username}": ${err instanceof Error ? err.message : String(err)}`,
					"SCRAPE_FAILED",
				);
			}

			// Scrape and analyze competitors
			await updateStatus(evalId, "analyzing");
			let competitorData: CompetitorData;
			try {
				competitorData = await competitorService.analyzeCompetitors(
					competitors,
					{ resultsLimit: 5 },
				);
			} catch (err) {
				throw new EvaluationServiceError(
					`Failed to analyze competitors: ${err instanceof Error ? err.message : String(err)}`,
					"SCRAPE_FAILED",
				);
			}

			// Generate guide
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

			// Judge guide
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

			// Regenerate if score < threshold
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

			// Store final result
			await updateStatus(evalId, "completed", {
				guideContent: guide,
				qualityScore: judgeResult.score,
			});
		} catch (err) {
			// Refund credit on any pipeline failure
			try {
				await refundCredit(userId);
			} catch {
				// Log but don't mask the original error
			}

			await updateStatus(evalId, "failed");
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
