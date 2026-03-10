"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { signOut } from "@/lib/auth/client";
import { useCredits, useEvaluations } from "@/lib/hooks";
import type { Evaluation } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

const statusLabels: Record<string, string> = {
	pending: "Pendente",
	scraping: "Coletando dados",
	analyzing: "Analisando",
	generating: "Gerando guia",
	judging: "Avaliando qualidade",
	completed: "Concluído",
	failed: "Falhou",
};

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function ScoreBadge({ score }: { score: number | null }) {
	if (score === null) return <span className="text-muted-foreground">—</span>;
	const color =
		score >= 80
			? "text-emerald-600"
			: score >= 60
				? "text-amber-600"
				: "text-red-600";
	return <span className={`font-medium ${color}`}>{score}/100</span>;
}

function EvaluationRow({ evaluation }: { evaluation: Evaluation }) {
	return (
		<Link
			href={`/dashboard/evaluations/${evaluation.id}`}
			className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 last:border-b-0"
		>
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="truncate font-medium">@{evaluation.username}</span>
				<span className="text-muted-foreground">
					{formatDate(evaluation.createdAt)}
				</span>
			</div>
			<div className="flex items-center gap-4 shrink-0">
				<span className="text-muted-foreground text-xs">
					{statusLabels[evaluation.status] ?? evaluation.status}
				</span>
				<ScoreBadge score={evaluation.qualityScore} />
			</div>
		</Link>
	);
}

export default function DashboardPage() {
	const router = useRouter();
	const { data: balance, isLoading: creditsLoading } = useCredits();
	const { data: evaluations, isLoading: evalsLoading } = useEvaluations();

	async function handleBuyCredits() {
		try {
			const { data } = await api.post<{ url: string }>("/credits/checkout", {
				quantity: 1,
			});
			window.location.href = data.url;
		} catch {
			/* Stripe redirect failed */
		}
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => signOut().then(() => router.push("/login"))}
				>
					Sair
				</Button>
			</div>
			<div className="flex flex-col sm:flex-row gap-3 mb-8">
				<Card className="flex-1">
					<CardHeader>
						<CardDescription>Créditos</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							{creditsLoading ? "…" : (balance ?? 0)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Button variant="outline" size="sm" onClick={handleBuyCredits}>
							Comprar créditos
						</Button>
					</CardContent>
				</Card>
				<Card className="flex-1">
					<CardHeader>
						<CardDescription>Avaliações</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							{evalsLoading ? "…" : (evaluations?.length ?? 0)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Link href="/dashboard/evaluate">
							<Button size="sm">Nova avaliação</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Histórico</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{evalsLoading ? (
						<p className="px-4 py-6 text-center text-muted-foreground">
							Carregando…
						</p>
					) : !evaluations?.length ? (
						<p className="px-4 py-6 text-center text-muted-foreground">
							Nenhuma avaliação ainda.
						</p>
					) : (
						<div>
							{evaluations.map((ev) => (
								<EvaluationRow key={ev.id} evaluation={ev} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
