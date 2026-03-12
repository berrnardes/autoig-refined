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
import { useCallback, useEffect, useRef, useState } from "react";

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

interface PixData {
	paymentId: number;
	qrCodeBase64: string;
	qrCode: string;
	ticketUrl: string;
	expiresAt: string;
}

function PixModal({ pix, onClose }: { pix: PixData; onClose: () => void }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(pix.qrCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label="Pagamento Pix"
		>
			<div
				className="bg-background rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-lg font-semibold text-center">Pagar com Pix</h2>
				<p className="text-sm text-muted-foreground text-center">
					Escaneie o QR Code ou copie o código abaixo
				</p>
				<div className="flex justify-center">
					<img
						src={`data:image/png;base64,${pix.qrCodeBase64}`}
						alt="QR Code Pix"
						className="w-48 h-48"
					/>
				</div>
				<div className="flex gap-2">
					<input
						type="text"
						readOnly
						value={pix.qrCode}
						className="flex-1 min-w-0 rounded-md border border-border bg-muted px-3 py-2 text-xs truncate"
						aria-label="Código Pix copia e cola"
					/>
					<Button variant="outline" size="sm" onClick={handleCopy}>
						{copied ? "Copiado" : "Copiar"}
					</Button>
				</div>
				<p className="text-xs text-muted-foreground text-center">
					Expira em 30 minutos. Seus créditos serão adicionados automaticamente
					após o pagamento.
				</p>
				<Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
					Fechar
				</Button>
			</div>
		</div>
	);
}

export default function DashboardPage() {
	const router = useRouter();
	const {
		data: balance,
		isLoading: creditsLoading,
		refetch: refetchCredits,
	} = useCredits();
	const { data: evaluations, isLoading: evalsLoading } = useEvaluations();
	const [pixData, setPixData] = useState<PixData | null>(null);
	const [buying, setBuying] = useState(false);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	// Poll credits while Pix modal is open to detect payment
	useEffect(() => {
		if (!pixData) {
			stopPolling();
			return;
		}
		const initialBalance = balance ?? 0;
		pollRef.current = setInterval(async () => {
			const { data: fresh } = await refetchCredits();
			if (fresh !== undefined && fresh > initialBalance) {
				setPixData(null);
			}
		}, 5000);
		return stopPolling;
	}, [pixData, balance, refetchCredits, stopPolling]);

	async function handleBuyCredits() {
		setBuying(true);
		try {
			const { data } = await api.post<PixData>("/credits/checkout", {
				quantity: 1,
			});
			setPixData(data);
		} catch (err) {
			console.error("Failed to start checkout:", err);
		} finally {
			setBuying(false);
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
						<Button
							variant="outline"
							size="sm"
							onClick={handleBuyCredits}
							disabled={buying}
						>
							{buying ? "Gerando Pix…" : "Comprar créditos"}
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
			{pixData && <PixModal pix={pixData} onClose={() => setPixData(null)} />}
		</div>
	);
}
