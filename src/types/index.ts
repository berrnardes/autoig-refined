export interface PostData {
	postId: string;
	shortCode: string;
	caption: string;
	likes: number;
	comments: number;
	hashtags: string[];
	timestamp: string;
	type: "image" | "video" | "carousel";
}

export interface ProfileData {
	instagramId: string;
	username: string;
	fullName: string;
	bio: string;
	url: string;
	externalUrl: string | null;
	isBusinessAccount: boolean;
	businessCategoryName: string | null;
	verified: boolean;
	private: boolean;
	highlightReelCount: number;
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

export interface PerformanceMetric {
	metric: string;
	userValue: string;
	competitorValue: string;
}

export interface ContentSuggestion {
	type: string;
	description: string;
}

export interface GuideContent {
	profileScore: number; // 0–100
	summary: string;
	performanceComparison: PerformanceMetric[];
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
	contentStrategySuggestions: ContentSuggestion[];
	taskList: Array<{
		task: string;
		priority: "high" | "medium" | "low";
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
