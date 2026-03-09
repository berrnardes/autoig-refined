import { z } from "zod";

const usernameSchema = z
	.string()
	.min(1, "Username is required")
	.max(30, "Username must be 30 characters or less")
	.regex(
		/^[a-zA-Z0-9._]+$/,
		"Username can only contain letters, numbers, dots, and underscores",
	);

export const createEvaluationSchema = z.object({
	username: usernameSchema,
	competitors: z
		.array(usernameSchema)
		.min(1, "At least 1 competitor is required")
		.max(5, "Maximum 5 competitors allowed"),
});

export const postDataSchema = z.object({
	caption: z.string(),
	likes: z.number().int().nonnegative(),
	comments: z.number().int().nonnegative(),
	hashtags: z.array(z.string()),
	timestamp: z.string(),
	type: z.enum(["image", "video", "carousel"]),
});

export const profileDataSchema = z.object({
	username: z.string().min(1),
	bio: z.string(),
	followerCount: z.number().int().nonnegative(),
	followingCount: z.number().int().nonnegative(),
	postCount: z.number().int().nonnegative(),
	posts: z.array(postDataSchema),
	averageLikes: z.number().nonnegative(),
	averageComments: z.number().nonnegative(),
	engagementRate: z.number().nonnegative(),
	postingFrequency: z.number().nonnegative(),
	topHashtags: z.array(z.string()),
	scrapedAt: z.string(),
});

export const guideContentSchema = z.object({
	summary: z.string().min(1, "Summary is required"),
	weaknesses: z
		.array(
			z.object({
				area: z.string(),
				description: z.string(),
				severity: z.enum(["high", "medium", "low"]),
			}),
		)
		.min(1, "At least one weakness is required"),
	recommendations: z
		.array(
			z.object({
				criterion: z.string(),
				currentState: z.string(),
				recommendation: z.string(),
				priority: z.number().int().positive(),
			}),
		)
		.min(1, "At least one recommendation is required"),
	taskList: z
		.array(
			z.object({
				task: z.string(),
				priority: z.number().int().positive(),
				estimatedImpact: z.enum(["high", "medium", "low"]),
			}),
		)
		.min(1, "At least one task is required"),
});

export const judgeScoreSchema = z.object({
	score: z.number().int().min(0).max(100),
	feedback: z.string(),
});
