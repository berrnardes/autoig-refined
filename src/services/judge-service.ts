import { judgeScoreSchema } from "@/lib/validators";
import type { GuideContent } from "@/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const JUDGE_SYSTEM_PROMPT = `You are an independent quality evaluator for Instagram profile optimization guides.
Your role is to objectively assess guides on three dimensions:

1. **Completeness** — Does the guide cover all five evaluation criteria (bio clarity, content strategy, posting consistency, value proposition, highlights/links)? Are weaknesses identified with appropriate severity? Is the task list comprehensive?

2. **Actionability** — Are recommendations specific and measurable? Can the user take concrete steps based on the guide? Are tasks prioritized with clear impact estimates?

3. **Relevance** — Are recommendations grounded in the actual profile data and competitor benchmarks? Do they address real gaps rather than generic advice?

Score the guide from 0 to 100:
- 90-100: Exceptional — thorough, specific, data-driven, immediately actionable
- 70-89: Good — covers all areas with mostly specific recommendations
- 60-69: Acceptable — adequate coverage but some recommendations are vague or generic
- 40-59: Below average — missing criteria, generic advice, or weak prioritization
- 0-39: Poor — incomplete, irrelevant, or not actionable

Provide structured feedback explaining your score, highlighting strengths and specific areas for improvement.`;

const JUDGE_USER_PROMPT = `Evaluate the following Instagram profile optimization guide:

## Summary
{summary}

## Weaknesses Identified ({weaknessCount} total)
{weaknesses}

## Recommendations ({recommendationCount} total)
{recommendations}

## Task List ({taskCount} total)
{taskList}

Provide your evaluation score (0-100) and detailed feedback.`;

function formatGuideForJudging(guide: GuideContent): Record<string, string> {
	const weaknesses = guide.weaknesses
		.map(
			(w, i) =>
				`${i + 1}. [${w.severity.toUpperCase()}] ${w.area}: ${w.description}`,
		)
		.join("\n");

	const recommendations = guide.recommendations
		.map(
			(r, i) =>
				`${i + 1}. [Priority ${r.priority}] ${r.criterion}\n   Current: ${r.currentState}\n   Recommendation: ${r.recommendation}`,
		)
		.join("\n\n");

	const taskList = guide.taskList
		.map(
			(t, i) =>
				`${i + 1}. [Priority ${t.priority}, Impact: ${t.estimatedImpact}] ${t.task}`,
		)
		.join("\n");

	return {
		summary: guide.summary,
		weaknessCount: String(guide.weaknesses.length),
		weaknesses: weaknesses || "None listed",
		recommendationCount: String(guide.recommendations.length),
		recommendations: recommendations || "None listed",
		taskCount: String(guide.taskList.length),
		taskList: taskList || "None listed",
	};
}

function createJudgeModel() {
	return new ChatOpenAI({
		model: "gpt-4.1-mini",
		temperature: 0.3,
	});
}

export async function evaluateGuide(
	guide: GuideContent,
): Promise<{ score: number; feedback: string }> {
	const model = createJudgeModel();
	const structuredModel = model.withStructuredOutput(judgeScoreSchema, {
		name: "judge_score",
		strict: true,
	});

	const prompt = ChatPromptTemplate.fromMessages([
		["system", JUDGE_SYSTEM_PROMPT],
		["user", JUDGE_USER_PROMPT],
	]);

	const chain = prompt.pipe(structuredModel);
	const vars = formatGuideForJudging(guide);

	const result = await chain.invoke(vars);
	return { score: result.score, feedback: result.feedback };
}
