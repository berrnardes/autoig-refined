export interface PostData {
	caption: string;
	likes: number;
	comments: number;
	hashtags: string[];
	timestamp: string;
	type: "image" | "video" | "carousel";
}

export interface ProfileData {
	username: string;
	bio: string;
	followerCount: number;
	followingCount: number;
	postCount: number;
	posts: PostData[];
	averageLikes: number;
	averageComments: number;
	engagementRate: number;
	postingFrequency: number; // posts per week
	topHashtags: string[];
	scrapedAt: string; // ISO timestamp
}

export interface CompetitorData {
	competitors: Array<{
		username: string;
		profileData: ProfileData;
	}>;
	aggregated: {
		averageFollowers: number;
		averageEngagementRate: number;
		averagePostingFrequency: number;
		commonHashtags: string[];
		bioPatterns: string[];
		contentTypeMix: { image: number; video: number; carousel: number };
	};
	failedUsernames: string[];
}

export interface GuideContent {
	summary: string;
	weaknesses: Array<{
		area: string;
		description: string;
		severity: "high" | "medium" | "low";
	}>;
	recommendations: Array<{
		criterion: string;
		currentState: string;
		recommendation: string;
		priority: number;
	}>;
	taskList: Array<{
		task: string;
		priority: number;
		estimatedImpact: "high" | "medium" | "low";
	}>;
}

export type EvaluationStatus =
	| "pending"
	| "scraping"
	| "analyzing"
	| "generating"
	| "judging"
	| "completed"
	| "failed";

export interface Evaluation {
	id: string;
	userId: string;
	username: string;
	competitors: string[];
	guideContent: GuideContent | null;
	qualityScore: number | null;
	status: EvaluationStatus;
	createdAt: string;
}
