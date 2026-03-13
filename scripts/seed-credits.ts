#!/usr/bin/env npx tsx
/**
 * Seed credits for a user by email.
 * Usage: npx tsx scripts/seed-credits.ts <email> <amount>
 * Example: npx tsx scripts/seed-credits.ts user@example.com 10
 */
import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const [, , email, amountArg] = process.argv;

if (!email || !amountArg) {
	console.error("Usage: npx tsx scripts/seed-credits.ts <email> <amount>");
	process.exit(1);
}

const amount = parseInt(amountArg, 10);
if (isNaN(amount) || amount <= 0) {
	console.error("Amount must be a positive integer.");
	process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
	const client = await pool.connect();
	try {
		// Look up user
		const { rows: users } = await client.query(
			`SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`,
			[email],
		);

		if (users.length === 0) {
			console.error(`No user found with email: ${email}`);
			process.exit(1);
		}

		const userId = users[0].id;

		// Check for existing credits row (no unique constraint on user_id)
		const { rows: existing } = await client.query(
			`SELECT id, balance FROM credits WHERE user_id = $1 LIMIT 1`,
			[userId],
		);

		let finalBalance: number;
		if (existing.length > 0) {
			const { rows } = await client.query(
				`UPDATE credits SET balance = balance + $1, updated_at = NOW()
         WHERE user_id = $2 RETURNING balance`,
				[amount, userId],
			);
			finalBalance = rows[0].balance;
		} else {
			const { rows } = await client.query(
				`INSERT INTO credits (user_id, balance) VALUES ($1, $2) RETURNING balance`,
				[userId, amount],
			);
			finalBalance = rows[0].balance;
		}

		console.log(`✓ ${email} now has ${finalBalance} credit(s).`);
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
