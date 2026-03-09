import { db } from "@/db";
import { scrapeCache } from "@/db/schema";
import { profileDataSchema } from "@/lib/validators";
import type { PostData, ProfileData } from "@/types";
import { ApifyClient } from "apify-client";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const ACTOR_ID = "shu8hvrXbJbY3Eb9W"; // apify/instagram-scraper

export interface ScrapeOptions {
	/** "posts" to get post data, "details" to get profile metadata only */
	resultsType?: "posts" | "details";
	/** Max number of posts to scrape (default: 50) */
	resultsLimit?: number;
	/** Whether to include parent (profile) data alongside posts */
	addParentData?: boolean;
}

const DEFAULT_OPTIONS: Required<ScrapeOptions> = {
	resultsType: "posts",
	resultsLimit: 50,
	addParentData: true,
};

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
 * Calls the apify/instagram-scraper actor (shu8hvrXbJbY3Eb9W) via the SDK.
 * Uses directUrls for precise targeting and exposes resultsType/resultsLimit.
 */
async function callApify(
	username: string,
	options: Required<ScrapeOptions>,
): Promise<Record<string, unknown>[]> {
	const client = getApifyClient();

	try {
		const run = await client.actor(ACTOR_ID).call({
			directUrls: [`https://www.instagram.com/${username}/`],
			resultsType: options.resultsType,
			resultsLimit: options.resultsLimit,
			searchType: "user",
			searchLimit: 1,
			addParentData: options.addParentData,
		});

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
 * Extracts profile-level metadata from the first item that carries parent data
 * or from a "details" result item.
 */
function extractProfileMeta(
	username: string,
	items: Record<string, unknown>[],
): {
	bio: string;
	followerCount: number;
	followingCount: number;
	postCount: number;
	fullName: string;
} {
	// When addParentData is true, each post item has profile info at the top level
	// or nested under a key. For "details" resultsType the item IS the profile.
	const source = items[0] ?? {};

	return {
		bio: (source.biography ?? source.bio ?? "") as string,
		followerCount: (source.followersCount ??
			source.followedByCount ??
			0) as number,
		followingCount: (source.followsCount ??
			source.followingCount ??
			0) as number,
		postCount: (source.postsCount ?? source.postCount ?? 0) as number,
		fullName: (source.fullName ?? source.ownerFullName ?? "") as string,
	};
}

/**
 * Normalizes raw Apify instagram-scraper post items into our PostData shape.
 */
function normalizePosts(items: Record<string, unknown>[]): PostData[] {
	return items.map((item) => {
		const caption = (item.caption ?? "") as string;
		const hashtags =
			(item.hashtags as string[] | undefined) ??
			(caption.match(/#[\w]+/g) ?? []).map((h: string) => h.replace("#", ""));

		return {
			caption,
			likes: (item.likesCount ?? 0) as number,
			comments: (item.commentsCount ?? 0) as number,
			hashtags,
			timestamp: (item.timestamp ?? new Date().toISOString()) as string,
			type:
				item.type === "Video"
					? "video"
					: item.type === "Sidecar"
						? "carousel"
						: "image",
		} satisfies PostData;
	});
}

/**
 * Builds a full ProfileData object from scraped items.
 */
function buildProfileData(
	username: string,
	items: Record<string, unknown>[],
): ProfileData {
	const meta = extractProfileMeta(username, items);
	const posts = normalizePosts(items);

	const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
	const totalComments = posts.reduce((s, p) => s + p.comments, 0);
	const averageLikes = posts.length > 0 ? totalLikes / posts.length : 0;
	const averageComments = posts.length > 0 ? totalComments / posts.length : 0;

	const engagementRate =
		meta.followerCount > 0 && posts.length > 0
			? ((averageLikes + averageComments) / meta.followerCount) * 100
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
		username: (items[0]?.ownerUsername as string) ?? username,
		bio: meta.bio,
		followerCount: meta.followerCount,
		followingCount: meta.followingCount,
		postCount: meta.postCount,
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
 * Scrape service with cache-first strategy, 24h TTL, and configurable options.
 */
export const scrapeService = {
	async scrapeProfile(
		username: string,
		forceRefresh = false,
		options?: ScrapeOptions,
	): Promise<ProfileData> {
		const normalizedUsername = username.toLowerCase().replace(/^@/, "");
		const opts = { ...DEFAULT_OPTIONS, ...options };

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
		const items = await callApify(normalizedUsername, opts);

		if (items.length === 0) {
			throw new ScrapeServiceError(
				`Instagram profile "${normalizedUsername}" not found or returned no data`,
				"INVALID_USERNAME",
			);
		}

		// Check for error responses from the actor
		if (items[0].error || items[0].profileNotFound) {
			throw new ScrapeServiceError(
				`Instagram profile "${normalizedUsername}" does not exist or is private`,
				"INVALID_USERNAME",
			);
		}

		const profileData = buildProfileData(normalizedUsername, items);

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
