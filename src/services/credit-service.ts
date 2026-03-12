import { db } from "@/db";
import { credits, creditTransactions } from "@/db/schema";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { MercadoPagoConfig, Payment } from "mercadopago";

export class CreditServiceError extends Error {
	constructor(
		message: string,
		public code:
			| "INSUFFICIENT_CREDITS"
			| "USER_NOT_FOUND"
			| "PAYMENT_ERROR"
			| "WEBHOOK_ERROR"
			| "DUPLICATE_EVENT",
	) {
		super(message);
		this.name = "CreditServiceError";
	}
}

const mpClient = new MercadoPagoConfig({
	accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
const paymentClient = new Payment(mpClient);

const CREDIT_UNIT_PRICE = Number(process.env.CREDIT_UNIT_PRICE ?? "10");

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

		const newBalance = row.balance - 1;

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

export interface PixPaymentResult {
	paymentId: number;
	qrCodeBase64: string;
	qrCode: string;
	ticketUrl: string;
	expiresAt: string;
}

/**
 * Create a Mercado Pago Pix payment for purchasing credits.
 * Returns QR code data for the user to scan.
 */
export async function createPixPayment(
	userId: string,
	userEmail: string,
	quantity: number,
): Promise<PixPaymentResult> {
	const amount = quantity * CREDIT_UNIT_PRICE;
	const expiration = new Date();
	expiration.setMinutes(expiration.getMinutes() + 30);

	try {
		const response = await paymentClient.create({
			body: {
				transaction_amount: amount,
				description: `${quantity} crédito(s) - Instagram Profile Optimizer`,
				payment_method_id: "pix",
				payer: { email: userEmail },
				metadata: {
					user_id: userId,
					credit_quantity: String(quantity),
				},
				date_of_expiration: expiration.toISOString(),
			},
			requestOptions: { idempotencyKey: randomUUID() },
		});

		const txData = response.point_of_interaction?.transaction_data;
		if (!txData?.qr_code_base64 || !txData?.qr_code) {
			throw new CreditServiceError(
				"Failed to generate Pix payment. Please try again.",
				"PAYMENT_ERROR",
			);
		}

		return {
			paymentId: response.id!,
			qrCodeBase64: txData.qr_code_base64,
			qrCode: txData.qr_code,
			ticketUrl: txData.ticket_url ?? "",
			expiresAt: expiration.toISOString(),
		};
	} catch (error) {
		if (error instanceof CreditServiceError) throw error;
		console.error("Mercado Pago SDK error:", error);
		throw new CreditServiceError(
			"Failed to create Pix payment. Please try again.",
			"PAYMENT_ERROR",
		);
	}
}

/**
 * Handle a Mercado Pago webhook notification for payment.approved.
 * Idempotent: checks if credits were already added for this payment.
 */
export /**
 * Handle a Mercado Pago webhook notification for payment.approved.
 * Idempotent: checks if credits were already added for this payment.
 */
async function handleWebhook(paymentId: string): Promise<void> {
	let payment;
	try {
		payment = await paymentClient.get({ id: paymentId });
	} catch (err: unknown) {
		// Mercado Pago sends test webhooks with fake IDs (e.g. "123456").
		// The API returns 404 for these — just ignore them.
		if (
			err &&
			typeof err === "object" &&
			"status" in err &&
			err.status === 404
		) {
			console.warn(
				`Webhook ignored: payment ${paymentId} not found (likely a test notification).`,
			);
			return;
		}
		throw err;
	}

	if (payment.status !== "approved") return;

	const userId = payment.metadata?.user_id as string | undefined;
	const quantity = Number(payment.metadata?.credit_quantity ?? 0);

	if (!userId || !quantity || quantity <= 0) {
		throw new CreditServiceError(
			"Invalid webhook payload: missing userId or quantity.",
			"WEBHOOK_ERROR",
		);
	}

	const referenceId = String(payment.id);

	// Idempotency check
	const [existing] = await db
		.select({ id: creditTransactions.id })
		.from(creditTransactions)
		.where(eq(creditTransactions.referenceId, referenceId))
		.limit(1);

	if (existing) return;

	await db.transaction(async (tx) => {
		const [row] = await tx
			.select({ balance: credits.balance })
			.from(credits)
			.where(eq(credits.userId, userId))
			.limit(1);

		if (row) {
			await tx
				.update(credits)
				.set({ balance: row.balance + quantity, updatedAt: new Date() })
				.where(eq(credits.userId, userId));
		} else {
			await tx.insert(credits).values({ userId, balance: quantity });
		}

		await tx.insert(creditTransactions).values({
			userId,
			amount: quantity,
			type: "purchase",
			referenceId,
		});
	});
}
