import type { CompetitorData, ProfileData } from "@/types";
import type { ScrapeOptions } from "./scrape-service";
import { scrapeService } from "./scrape-service";

export class CompetitorServiceError extends Error {
	constructor(
		message: string,
		public readonly code: "VALIDATION_ERROR" | "SCRAPE_ERROR",
	) {
		super(message);
		this.name = "CompetitorServiceError";
	}
}

/**
 * Aggregates an array of successful ProfileData objects into the
 * CompetitorData.aggregated shape.
 */
function aggregate(profiles: ProfileData[]): CompetitorData["aggregated"] {
	const count = profiles.length;

	const averageFollowers =
		profiles.reduce((s, p) => s + p.followerCount, 0) / count;
	const averageEngagementRate =
		profiles.reduce((s, p) => s + p.engagementRate, 0) / count;
	const averagePostingFrequency =
		profiles.reduce((s, p) => s + p.postingFrequency, 0) / count;

	// Collect hashtags that appear in more than one profile
	const hashtagCounts = new Map<string, number>();
	for (const p of profiles) {
		for (const tag of p.topHashtags) {
			hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
		}
	}
	const commonHashtags = [...hashtagCounts.entries()]
		.filter(([, c]) => c > 1 || count === 1)
		.sort((a, b) => b[1] - a[1])
		.map(([tag]) => tag);

	// Collect bio patterns (non-empty bios)
	const bioPatterns = profiles.map((p) => p.bio).filter((b) => b.length > 0);

	// Content type mix (percentage across all posts)
	let imageCount = 0;
	let videoCount = 0;
	let carouselCount = 0;
	for (const p of profiles) {
		for (const post of p.posts) {
			if (post.type === "image") imageCount++;
			else if (post.type === "video") videoCount++;
			else if (post.type === "carousel") carouselCount++;
		}
	}
	const totalPosts = imageCount + videoCount + carouselCount;
	const contentTypeMix =
		totalPosts > 0
			? {
					image: imageCount / totalPosts,
					video: videoCount / totalPosts,
					carousel: carouselCount / totalPosts,
				}
			: { image: 0, video: 0, carousel: 0 };

	return {
		averageFollowers,
		averageEngagementRate,
		averagePostingFrequency,
		commonHashtags,
		bioPatterns,
		contentTypeMix,
	};
}

export const competitorService = {
	/**
	 * Scrapes and aggregates competitor profiles.
	 * Accepts 1–5 usernames; rejects 0 or >5.
	 * Uses Promise.allSettled so partial failures don't block the result.
	 */
	async analyzeCompetitors(
		usernames: string[],
		options?: ScrapeOptions,
	): Promise<CompetitorData> {
		if (usernames.length === 0 || usernames.length > 5) {
			throw new CompetitorServiceError(
				`Expected 1–5 competitor usernames, received ${usernames.length}`,
				"VALIDATION_ERROR",
			);
		}

		const results = await Promise.allSettled(
			usernames.map((u) => scrapeService.scrapeProfile(u, false, options)),
		);

		const competitors: CompetitorData["competitors"] = [];
		const failedUsernames: string[] = [];

		results.forEach((result, i) => {
			if (result.status === "fulfilled") {
				competitors.push({
					username: usernames[i],
					profileData: result.value,
				});
			} else {
				failedUsernames.push(usernames[i]);
			}
		});

		if (competitors.length === 0) {
			throw new CompetitorServiceError(
				"All competitor profiles failed to scrape",
				"SCRAPE_ERROR",
			);
		}

		const aggregated = aggregate(competitors.map((c) => c.profileData));

		return { competitors, aggregated, failedUsernames };
	},
};
