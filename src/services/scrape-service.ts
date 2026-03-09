import { db } from "@/db";
import { scrapeCache } from "@/db/schema";
import { profileDataSchema } from "@/lib/validators";
import type { PostData, ProfileData } from "@/types";
import { ApifyClient } from "apify";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class ScrapeServiceError extends Error {
	constructor(
		message: string,
		public readonly code: "INVALID_USERNAME" | "APIFY_ERROR" | "PARSE_ERROR",
	) {
		super(message);
		this.name = "ScrapeServiceError";
	}
}

function getApifyClient(): ApifyClient {
	const token = process.env.APIFY_API_TOKEN;
	if (!token) {
		throw new ScrapeServiceError(
			"APIFY_API_TOKEN is not configured",
			"APIFY_ERROR",
		);
	}
	return new ApifyClient({ token });
}

/**
 * Calls the Apify instagram-profile-scraper actor via the SDK.
 * The SDK handles retries with exponential backoff automatically.
 */
async function callApify(username: string): Promise<Record<string, unknown>[]> {
	const client = getApifyClient();

	try {
		const run = await client
			.actor("apify/instagram-profile-scraper")
			.call({ usernames: [username] });

		const { items } = await client.dataset(run.defaultDatasetId).listItems();

		return items as Record<string, unknown>[];
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new ScrapeServiceError(
			`Apify API request failed: ${message}`,
			"APIFY_ERROR",
		);
	}
}

/**
 * Normalizes raw Apify response data into our ProfileData schema.
 */
function normalizeApifyResponse(
	username: string,
	raw: Record<string, unknown>,
): ProfileData {
	const rawPosts = (raw.latestPosts ?? raw.posts ?? []) as Record<
		string,
		unknown
	>[];

	const posts: PostData[] = rawPosts.map((post) => {
		const caption = (post.caption ?? post.text ?? "") as string;
		const hashtags =
			(post.hashtags as string[] | undefined) ??
			(typeof caption === "string"
				? (caption.match(/#[\w]+/g) ?? []).map((h: string) =>
						h.replace("#", ""),
					)
				: []);

		return {
			caption,
			likes: (post.likesCount ?? post.likes ?? 0) as number,
			comments: (post.commentsCount ?? post.comments ?? 0) as number,
			hashtags,
			timestamp: (post.timestamp ??
				post.takenAtTimestamp ??
				new Date().toISOString()) as string,
			type:
				post.type === "Video"
					? "video"
					: post.type === "Sidecar"
						? "carousel"
						: "image",
		} satisfies PostData;
	});

	const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
	const totalComments = posts.reduce((s, p) => s + p.comments, 0);
	const averageLikes = posts.length > 0 ? totalLikes / posts.length : 0;
	const averageComments = posts.length > 0 ? totalComments / posts.length : 0;

	const followerCount = (raw.followersCount ?? raw.followers ?? 0) as number;
	const engagementRate =
		followerCount > 0 && posts.length > 0
			? ((averageLikes + averageComments) / followerCount) * 100
			: 0;

	let postingFrequency = 0;
	if (posts.length >= 2) {
		const timestamps = posts
			.map((p) => new Date(p.timestamp).getTime())
			.filter((t) => !Number.isNaN(t))
			.sort((a, b) => b - a);

		if (timestamps.length >= 2) {
			const spanMs = timestamps[0] - timestamps[timestamps.length - 1];
			const spanWeeks = spanMs / (7 * 24 * 60 * 60 * 1000);
			postingFrequency = spanWeeks > 0 ? timestamps.length / spanWeeks : 0;
		}
	}

	const hashtagCounts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.hashtags) {
			hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
		}
	}
	const topHashtags = [...hashtagCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20)
		.map(([tag]) => tag);

	return {
		username: (raw.username as string) ?? username,
		bio: (raw.biography ?? raw.bio ?? "") as string,
		followerCount,
		followingCount: (raw.followingCount ?? raw.following ?? 0) as number,
		postCount: (raw.postsCount ?? raw.postCount ?? posts.length) as number,
		posts,
		averageLikes,
		averageComments,
		engagementRate,
		postingFrequency,
		topHashtags,
		scrapedAt: new Date().toISOString(),
	};
}

/**
 * Scrape service with cache-first strategy and 24h TTL.
 */
export const scrapeService = {
	async scrapeProfile(
		username: string,
		forceRefresh = false,
	): Promise<ProfileData> {
		const normalizedUsername = username.toLowerCase().replace(/^@/, "");

		// Cache-first lookup (skip if forceRefresh)
		if (!forceRefresh) {
			const cached = await db
				.select()
				.from(scrapeCache)
				.where(eq(scrapeCache.username, normalizedUsername))
				.limit(1);

			if (cached.length > 0) {
				const entry = cached[0];
				const age = Date.now() - new Date(entry.scrapedAt).getTime();

				if (age < CACHE_TTL_MS) {
					const parsed = profileDataSchema.safeParse(entry.profileData);
					if (parsed.success) {
						return parsed.data;
					}
					// Cache corrupted — treat as miss and re-scrape
				}
			}
		}

		// Fetch from Apify
		const results = await callApify(normalizedUsername);

		if (results.length === 0) {
			throw new ScrapeServiceError(
				`Instagram profile "${normalizedUsername}" not found or returned no data`,
				"INVALID_USERNAME",
			);
		}

		const rawProfile = results[0];

		if (rawProfile.error || rawProfile.profileNotFound) {
			throw new ScrapeServiceError(
				`Instagram profile "${normalizedUsername}" does not exist or is private`,
				"INVALID_USERNAME",
			);
		}

		const profileData = normalizeApifyResponse(normalizedUsername, rawProfile);

		const parsed = profileDataSchema.safeParse(profileData);
		if (!parsed.success) {
			throw new ScrapeServiceError(
				`Failed to parse profile data for "${normalizedUsername}": ${parsed.error.message}`,
				"PARSE_ERROR",
			);
		}

		// Upsert cache entry
		const now = new Date();
		const existing = await db
			.select({ id: scrapeCache.id })
			.from(scrapeCache)
			.where(eq(scrapeCache.username, normalizedUsername))
			.limit(1);

		if (existing.length > 0) {
			await db
				.update(scrapeCache)
				.set({
					profileData: parsed.data,
					scrapedAt: now,
					updatedAt: now,
				})
				.where(eq(scrapeCache.username, normalizedUsername));
		} else {
			await db.insert(scrapeCache).values({
				username: normalizedUsername,
				profileData: parsed.data,
				scrapedAt: now,
				updatedAt: now,
			});
		}

		return parsed.data;
	},
};
