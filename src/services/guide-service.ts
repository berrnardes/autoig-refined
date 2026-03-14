import { guideContentSchema } from "@/lib/validators";
import type { CompetitorData, GuideContent, ProfileData } from "@/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const SYSTEM_PROMPT = `You are an expert Instagram marketing consultant specializing in the Brazilian market.
You analyze Instagram profiles and compare them against competitors to produce actionable optimization guides.

You evaluate profiles on these criteria:
1. Bio clarity and positioning — Is the bio clear, compelling, and niche-appropriate?
2. Content strategy — Are posts varied, high-quality, and aligned with audience interests?
3. Posting consistency — Is the posting frequency regular and competitive?
4. Value proposition — Does the profile clearly communicate what value it offers?
5. Highlights and links usage — Are highlights organized and links optimized?

IMPORTANT: All generated content (summary, descriptions, recommendations, tasks) MUST be written in Brazilian Portuguese (pt-BR). The target audience is Brazilian businesses and creators.

Your output must be structured, specific, and actionable. Reference actual data from the profiles.
Prioritize recommendations by potential impact. Use severity levels accurately:
- high: Critical issues significantly hurting growth
- medium: Notable gaps that limit potential
- low: Minor improvements for optimization

All recommendations must include specific, measurable actions the user can take.`;

const GENERATE_PROMPT = `Analyze this Instagram profile against the competitor data and generate a comprehensive optimization guide.

## User Profile
- Username: {username}
- Bio: {bio}
- Followers: {followerCount} | Following: {followingCount}
- Posts: {postCount} | Avg Likes: {averageLikes} | Avg Comments: {averageComments}
- Engagement Rate: {engagementRate}%
- Posting Frequency: {postingFrequency} posts/week
- Top Hashtags: {topHashtags}

## Competitor Benchmarks
- Avg Followers: {compAvgFollowers}
- Avg Engagement Rate: {compAvgEngagement}%
- Avg Posting Frequency: {compAvgPostingFrequency} posts/week
- Common Hashtags: {compCommonHashtags}
- Bio Patterns: {compBioPatterns}
- Content Mix: Images {compImages}% | Videos {compVideos}% | Carousels {compCarousels}%

## Individual Competitors
{competitorDetails}

Generate a guide with:
1. profileScore: an overall score from 0–100 based on the profile's performance vs competitors
2. summary: a concise executive summary of key findings
3. performanceComparison: a table comparing key metrics (engajamento, posts/semana, uso de vídeo, hashtags) between the user and competitors
4. weaknesses: issues found in the user's profile (with severity)
5. recommendations: for each of the 5 criteria — include currentState and specific recommendation. The criterion field MUST be exactly one of these values in Portuguese: "Clareza e Posicionamento da Bio", "Estratégia de Conteúdo", "Consistência de Postagens", "Proposta de Valor", "Destaques e Links"
6. contentStrategySuggestions: a list of recommended content types with descriptions (e.g. Reels de bastidores, Depoimentos de clientes)
7. taskList: prioritized action items with priority level (high/medium/low) and estimated impact

IMPORTANT: ALL text content (summary, descriptions, recommendations, tasks, metric names, weakness areas, content suggestions) MUST be written in Brazilian Portuguese (pt-BR). Do NOT use English for any field values.`;

const REGENERATE_PROMPT = `The previous guide was evaluated and received feedback for improvement.

## Judge Feedback
{feedback}

## User Profile
- Username: {username}
- Bio: {bio}
- Followers: {followerCount} | Following: {followingCount}
- Posts: {postCount} | Avg Likes: {averageLikes} | Avg Comments: {averageComments}
- Engagement Rate: {engagementRate}%
- Posting Frequency: {postingFrequency} posts/week
- Top Hashtags: {topHashtags}

## Competitor Benchmarks
- Avg Followers: {compAvgFollowers}
- Avg Engagement Rate: {compAvgEngagement}%
- Avg Posting Frequency: {compAvgPostingFrequency} posts/week
- Common Hashtags: {compCommonHashtags}
- Bio Patterns: {compBioPatterns}
- Content Mix: Images {compImages}% | Videos {compVideos}% | Carousels {compCarousels}%

## Individual Competitors
{competitorDetails}

Address the feedback and generate an improved guide with:
1. profileScore: an overall score from 0–100 based on the profile's performance vs competitors
2. summary: a concise executive summary of key findings
3. performanceComparison: a table comparing key metrics (engajamento, posts/semana, uso de vídeo, hashtags) between the user and competitors
4. weaknesses: issues found in the user's profile (with severity)
5. recommendations: for each of the 5 criteria — include currentState and specific recommendation. The criterion field MUST be exactly one of these values in Portuguese: "Clareza e Posicionamento da Bio", "Estratégia de Conteúdo", "Consistência de Postagens", "Proposta de Valor", "Destaques e Links"
6. contentStrategySuggestions: a list of recommended content types with descriptions (e.g. Reels de bastidores, Depoimentos de clientes)
7. taskList: prioritized action items with priority level (high/medium/low) and estimated impact

IMPORTANT: ALL text content (summary, descriptions, recommendations, tasks, metric names, weakness areas, content suggestions) MUST be written in Brazilian Portuguese (pt-BR). Do NOT use English for any field values.`;

function buildTemplateVars(
	profile: ProfileData,
	competitors: CompetitorData,
): Record<string, string> {
	const competitorDetails = competitors.competitors
		.map(
			(c) =>
				`- @${c.profileData.username}: ${c.profileData.followerCount} followers, ` +
				`${c.profileData.engagementRate}% engagement, ${c.profileData.postingFrequency} posts/week, ` +
				`bio: "${c.profileData.bio}"`,
		)
		.join("\n");

	const mix = competitors.aggregated.contentTypeMix;
	const total = mix.image + mix.video + mix.carousel || 1;

	return {
		username: profile.username,
		bio: profile.bio,
		followerCount: String(profile.followerCount),
		followingCount: String(profile.followingCount),
		postCount: String(profile.postCount),
		averageLikes: String(Math.round(profile.averageLikes)),
		averageComments: String(Math.round(profile.averageComments)),
		engagementRate: profile.engagementRate.toFixed(2),
		postingFrequency: profile.postingFrequency.toFixed(1),
		topHashtags: profile.topHashtags.join(", ") || "none",
		compAvgFollowers: String(
			Math.round(competitors.aggregated.averageFollowers),
		),
		compAvgEngagement: competitors.aggregated.averageEngagementRate.toFixed(2),
		compAvgPostingFrequency:
			competitors.aggregated.averagePostingFrequency.toFixed(1),
		compCommonHashtags:
			competitors.aggregated.commonHashtags.join(", ") || "none",
		compBioPatterns:
			competitors.aggregated.bioPatterns.join("; ") || "none observed",
		compImages: ((mix.image / total) * 100).toFixed(0),
		compVideos: ((mix.video / total) * 100).toFixed(0),
		compCarousels: ((mix.carousel / total) * 100).toFixed(0),
		competitorDetails: competitorDetails || "No competitor details available",
	};
}

function createGuideModel() {
	return new ChatOpenAI({
		model: "anthropic/claude-opus-4.6",
		configuration: {
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: process.env.OPENAI_API_KEY,
		},
	});
}

export async function generateGuide(
	profile: ProfileData,
	competitors: CompetitorData,
): Promise<GuideContent> {
	const model = createGuideModel();
	const structuredModel = model.withStructuredOutput(guideContentSchema, {
		name: "guide_content",
		strict: true,
	});

	const prompt = ChatPromptTemplate.fromMessages([
		["system", SYSTEM_PROMPT],
		["user", GENERATE_PROMPT],
	]);

	const chain = prompt.pipe(structuredModel);
	const vars = buildTemplateVars(profile, competitors);

	try {
		const result = await chain.invoke(vars);
		return result as GuideContent;
	} catch {
		// Retry once with stricter prompt on parse failure
		const strictPrompt = ChatPromptTemplate.fromMessages([
			[
				"system",
				SYSTEM_PROMPT +
					"\n\nCRITICAL: You MUST return valid structured data. " +
					"Every field is required. profileScore must be an integer 0–100. " +
					"performanceComparison and contentStrategySuggestions must have at least one entry. " +
					"severity, priority, and estimatedImpact must be exactly 'high', 'medium', or 'low'. " +
					"You must include recommendations for all 5 criteria using EXACTLY these Portuguese names: " +
					'"Clareza e Posicionamento da Bio", "Estratégia de Conteúdo", "Consistência de Postagens", "Proposta de Valor", "Destaques e Links". ' +
					"ALL text content must be in Brazilian Portuguese (pt-BR).",
			],
			["user", GENERATE_PROMPT],
		]);

		const retryChain = strictPrompt.pipe(structuredModel);
		const result = await retryChain.invoke(vars);
		return result as GuideContent;
	}
}

export async function regenerateGuide(
	profile: ProfileData,
	competitors: CompetitorData,
	feedback: string,
): Promise<GuideContent> {
	const model = createGuideModel();
	const structuredModel = model.withStructuredOutput(guideContentSchema, {
		name: "guide_content",
		strict: true,
	});

	const prompt = ChatPromptTemplate.fromMessages([
		["system", SYSTEM_PROMPT],
		["user", REGENERATE_PROMPT],
	]);

	const chain = prompt.pipe(structuredModel);
	const vars = { ...buildTemplateVars(profile, competitors), feedback };

	try {
		const result = await chain.invoke(vars);
		return result as GuideContent;
	} catch {
		const strictPrompt = ChatPromptTemplate.fromMessages([
			[
				"system",
				SYSTEM_PROMPT +
					"\n\nCRITICAL: You MUST return valid structured data. " +
					"Every field is required. Address the judge feedback directly. " +
					"profileScore must be an integer 0–100. " +
					"performanceComparison and contentStrategySuggestions must have at least one entry. " +
					"severity, priority, and estimatedImpact must be exactly 'high', 'medium', or 'low'. " +
					"You must include recommendations for all 5 criteria using EXACTLY these Portuguese names: " +
					'"Clareza e Posicionamento da Bio", "Estratégia de Conteúdo", "Consistência de Postagens", "Proposta de Valor", "Destaques e Links". ' +
					"ALL text content must be in Brazilian Portuguese (pt-BR).",
			],
			["user", REGENERATE_PROMPT],
		]);

		const retryChain = strictPrompt.pipe(structuredModel);
		const result = await retryChain.invoke(vars);
		return result as GuideContent;
	}
}

export async function generatePdf(guide: GuideContent): Promise<Buffer> {
	// Dynamic import to avoid issues with React PDF in non-browser contexts
	const { renderToBuffer } = await import("@react-pdf/renderer");
	const { createGuideDocument } = await import("@/lib/guide-pdf-document");

	const document = createGuideDocument(guide);
	const buffer = await renderToBuffer(document);

	// Verify PDF magic bytes
	if (
		buffer[0] !== 0x25 || // %
		buffer[1] !== 0x50 || // P
		buffer[2] !== 0x44 || // D
		buffer[3] !== 0x46 // F
	) {
		throw new Error("Generated PDF is invalid: missing PDF magic bytes");
	}

	return Buffer.from(buffer);
}
