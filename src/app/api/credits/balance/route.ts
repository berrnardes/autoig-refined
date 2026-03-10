import { auth } from "@/lib/auth";
import { getBalance } from "@/services/credit-service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const balance = await getBalance(session.user.id);
		return NextResponse.json({ balance });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
