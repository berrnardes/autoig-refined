import type { GuideContent, ProfileData } from "@/types";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const credits = pgTable(
	"credits",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull(),
		balance: integer("balance").notNull().default(0),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [index("credits_user_id_idx").on(table.userId)],
);

export const scrapeCache = pgTable("scrape_cache", {
	id: uuid("id").defaultRandom().primaryKey(),
	username: varchar("username", { length: 255 }).notNull().unique(),
	profileData: jsonb("profile_data").notNull().$type<ProfileData>(),
	scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const evaluations = pgTable(
	"evaluations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull(),
		username: varchar("username", { length: 255 }).notNull(),
		competitors: jsonb("competitors").notNull().$type<string[]>(),
		guideContent: jsonb("guide_content").$type<GuideContent>(),
		qualityScore: integer("quality_score"),
		status: varchar("status", { length: 50 }).notNull().default("pending"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [index("evaluations_user_id_idx").on(table.userId)],
);

export const creditTransactions = pgTable(
	"credit_transactions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull(),
		amount: integer("amount").notNull(),
		type: varchar("type", { length: 50 }).notNull(),
		referenceId: text("reference_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("credit_transactions_reference_id_idx").on(table.referenceId),
	],
);
