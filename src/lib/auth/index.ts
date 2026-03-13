import { db } from "@/db";
import { credits, creditTransactions } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

const FREE_SIGNUP_CREDITS = 1;

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()],
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db.insert(credits).values({
						userId: user.id,
						balance: FREE_SIGNUP_CREDITS,
					});
					await db.insert(creditTransactions).values({
						userId: user.id,
						amount: FREE_SIGNUP_CREDITS,
						type: "signup_bonus",
					});
				},
			},
		},
	},
});
