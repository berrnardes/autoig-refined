import { db } from "@/db";
import { creditTransactions, credits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

export class CreditServiceError extends Error {
	constructor(
		message: string,
		public code:
			| "INSUFFICIENT_CREDITS"
			| "USER_NOT_FOUND"
			| "STRIPE_ERROR"
			| "WEBHOOK_ERROR"
			| "DUPLICATE_EVENT",
	) {
		super(message);
		this.name = "CreditServiceError";
	}
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Get the credit balance for a user. Returns 0 if no record exists.
 */
export async function getBalance(userId: string): Promise<number> {
	const [row] = await db
		.select({ balance: credits.balance })
		.from(credits)
		.where(eq(credits.userId, userId))
		.limit(1);

	return row?.balance ?? 0;
}

/**
 * Deduct exactly 1 credit from a user's balance using row-level locking.
 * Throws CreditServiceError if insufficient credits.
 */
export async function deductCredit(
	userId: string,
): Promise<{ success: boolean; newBalance: number }> {
	const result = await db.transaction(async (tx) => {
		// Row-level lock with SELECT ... FOR UPDATE
		const { rows } = await tx.execute(
			sql`SELECT id, balance FROM credits WHERE user_id = ${userId} FOR UPDATE`,
		);
		const row = rows[0] as { id: string; balance: number } | undefined;

		if (!row || row.balance < 1) {
			throw new CreditServiceError(
				"Insufficient credits. Please purchase credits to continue.",
				"INSUFFICIENT_CREDITS",
			);
		}

		const currentBalance = row.balance;
		const newBalance = currentBalance - 1;

		await tx
			.update(credits)
			.set({ balance: newBalance, updatedAt: new Date() })
			.where(eq(credits.userId, userId));

		await tx.insert(creditTransactions).values({
			userId,
			amount: -1,
			type: "deduction",
		});

		return { success: true, newBalance };
	});

	return result;
}

/**
 * Refund exactly 1 credit to a user's balance (e.g. after a failed evaluation).
 */
export async function refundCredit(
	userId: string,
): Promise<{ success: boolean; newBalance: number }> {
	const result = await db.transaction(async (tx) => {
		const [row] = await tx
			.select({ balance: credits.balance })
			.from(credits)
			.where(eq(credits.userId, userId))
			.limit(1);

		if (!row) {
			throw new CreditServiceError(
				"User credit record not found.",
				"USER_NOT_FOUND",
			);
		}

		const newBalance = row.balance + 1;

		await tx
			.update(credits)
			.set({ balance: newBalance, updatedAt: new Date() })
			.where(eq(credits.userId, userId));

		await tx.insert(creditTransactions).values({
			userId,
			amount: 1,
			type: "refund",
		});

		return { success: true, newBalance };
	});

	return result;
}

/**
 * Create a Stripe Checkout Session for purchasing credits.
 * Returns the checkout session URL.
 */
export async function createCheckoutSession(
	userId: string,
	quantity: number,
): Promise<string> {
	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: [
				{
					price: process.env.STRIPE_CREDIT_PRICE_ID!,
					quantity,
				},
			],
			metadata: {
				userId,
				creditQuantity: String(quantity),
			},
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
		});

		if (!session.url) {
			throw new CreditServiceError(
				"Failed to create checkout session. Please try again.",
				"STRIPE_ERROR",
			);
		}

		return session.url;
	} catch (error) {
		if (error instanceof CreditServiceError) throw error;
		throw new CreditServiceError(
			"Failed to create checkout session. Please try again.",
			"STRIPE_ERROR",
		);
	}
}

/**
 * Verify and construct a Stripe event from a raw webhook payload.
 */
export function constructWebhookEvent(
	payload: string | Buffer,
	signature: string,
): Stripe.Event {
	try {
		return stripe.webhooks.constructEvent(
			payload,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!,
		);
	} catch {
		throw new CreditServiceError("Invalid webhook signature.", "WEBHOOK_ERROR");
	}
}

/**
 * Handle a Stripe webhook event. Currently supports `checkout.session.completed`.
 * Idempotent: checks if credits were already added for this session.
 */
export async function handleWebhook(event: Stripe.Event): Promise<void> {
	if (event.type !== "checkout.session.completed") return;

	const session = event.data.object as Stripe.Checkout.Session;
	const userId = session.metadata?.userId;
	const quantity = Number(session.metadata?.creditQuantity ?? 0);

	if (!userId || !quantity || quantity <= 0) {
		throw new CreditServiceError(
			"Invalid webhook payload: missing userId or quantity.",
			"WEBHOOK_ERROR",
		);
	}

	// Idempotency check: see if we already processed this session
	const [existing] = await db
		.select({ id: creditTransactions.id })
		.from(creditTransactions)
		.where(eq(creditTransactions.referenceId, session.id))
		.limit(1);

	if (existing) {
		// Already processed — skip silently
		return;
	}

	await db.transaction(async (tx) => {
		// Upsert the credits row: create if not exists, otherwise increment
		const [row] = await tx
			.select({ balance: credits.balance })
			.from(credits)
			.where(eq(credits.userId, userId))
			.limit(1);

		if (row) {
			await tx
				.update(credits)
				.set({
					balance: row.balance + quantity,
					updatedAt: new Date(),
				})
				.where(eq(credits.userId, userId));
		} else {
			await tx.insert(credits).values({
				userId,
				balance: quantity,
			});
		}

		await tx.insert(creditTransactions).values({
			userId,
			amount: quantity,
			type: "purchase",
			referenceId: session.id,
		});
	});
}
