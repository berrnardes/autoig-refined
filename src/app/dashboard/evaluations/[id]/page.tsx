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
import { useEvaluation } from "@/lib/hooks";
import type { GuideContent } from "@/types";
import { ContactSupport } from "@/components/contact-support";
import Link from "next/link";
import { use } from "react";

const statusLabels: Record<string, string> = {
	pending: "Pendente",
	scraping: "Coletando dados do Instagram…",
	analyzing: "Analisando concorrentes…",
	generating: "Gerando guia de otimização…",
	judging: "Avaliando qualidade do guia…",
	completed: "Concluído",
	failed: "Falhou",
};

const severityColors: Record<string, string> = {
	high: "text-red-600",
	medium: "text-amber-600",
	low: "text-emerald-600",
};

const impactLabels: Record<string, string> = {
	high: "Alto",
	medium: "Médio",
	low: "Baixo",
};

const priorityOrder: Record<string, number> = {
	high: 1,
	medium: 2,
	low: 3,
};

function isInProgress(status: string) {
	return ["pending", "scraping", "analyzing", "generating", "judging"].includes(
		status,
	);
}

const PIPELINE_STEPS: { key: string; label: string }[] = [
	{ key: "pending", label: "Preparando avaliação" },
	{ key: "scraping", label: "Coletando dados do perfil" },
	{ key: "analyzing", label: "Analisando concorrentes" },
	{ key: "generating", label: "Gerando guia com IA" },
	{ key: "judging", label: "Avaliando qualidade" },
];

function PipelineProgress({ status }: { status: string }) {
	const currentIndex = PIPELINE_STEPS.findIndex((s) => s.key === status);

	return (
		<Card className="mb-6">
			<CardContent className="py-6">
				<div className="flex flex-col gap-2.5">
					{PIPELINE_STEPS.map((step, i) => {
						const done = i < currentIndex;
						const active = i === currentIndex;
						return (
							<div key={step.key} className="flex items-center gap-3">
								<div
									className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-300 ${
										done
											? "bg-[#01337D]"
											: active
												? "bg-[#01337D] animate-pulse"
												: "bg-neutral-200"
									}`}
								/>
								<span
									className={`text-sm transition-colors duration-300 ${
										done
											? "text-muted-foreground line-through"
											: active
												? "text-foreground font-medium"
												: "text-muted-foreground/50"
									}`}
								>
									{step.label}
								</span>
								{done && (
									<span className="ml-auto text-xs text-[#01337D]">✓</span>
								)}
							</div>
						);
					})}
				</div>
				<p className="text-xs text-muted-foreground text-center mt-4">
					Isso pode levar alguns minutos.
				</p>
			</CardContent>
		</Card>
	);
}

export default function EvaluationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { data: evaluation, isLoading } = useEvaluation(id);

	async function handleDownloadPdf() {
		try {
			const response = await api.get(`/evaluations/${id}/pdf`, {
				responseType: "blob",
			});
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const a = document.createElement("a");
			a.href = url;
			a.download = `guia-${id}.pdf`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch {
			/* download failed */
		}
	}

	if (isLoading || !evaluation) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
				<p className="text-muted-foreground">Carregando…</p>
			</div>
		);
	}

	const inProgress = isInProgress(evaluation.status);

	return (
		<div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
			<Link
				href="/dashboard"
				className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block"
			>
				← Voltar
			</Link>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">
						@{evaluation.username}
					</h1>
					<p className="text-xs text-muted-foreground">
						{statusLabels[evaluation.status] ?? evaluation.status}
					</p>
				</div>
				{evaluation.guideContent?.profileScore !== undefined && (
					<div className="text-right">
						<p className="text-2xl font-semibold tabular-nums">
							{evaluation.guideContent.profileScore}
						</p>
						<p className="text-xs text-muted-foreground">/ 100</p>
					</div>
				)}
			</div>

			{inProgress && <PipelineProgress status={evaluation.status} />}

			{evaluation.status === "failed" && (
				<Card className="mb-6">
					<CardContent className="py-6 text-center space-y-2">
						<p className="text-sm text-destructive">
							A avaliação falhou. Seu crédito foi reembolsado.
						</p>
						<ContactSupport />
					</CardContent>
				</Card>
			)}

			{evaluation.status === "completed" && evaluation.guideContent && (
				<GuideDisplay
					guide={evaluation.guideContent}
					onDownload={handleDownloadPdf}
				/>
			)}
		</div>
	);
}

function GuideDisplay({
	guide,
	onDownload,
}: {
	guide: GuideContent;
	onDownload: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p>Diagnóstico completo em PDF:</p>
				<Button onClick={onDownload} className="self-start">
					Baixar
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Resumo</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm leading-relaxed">{guide.summary}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tarefas</CardTitle>
					<CardDescription>Ordenadas por prioridade</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{guide.taskList
						.sort(
							(a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
						)
						.map((t, i) => (
							<label
								key={i}
								className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 cursor-pointer transition-colors"
							>
								<input
									type="checkbox"
									className="w-4 h-4 rounded border-neutral-300 text-[#01337D] focus:ring-[#01337D] focus:ring-offset-0 cursor-pointer"
								/>
								<span className="text-sm flex-1">{t.task}</span>
								<span
									className={`text-xs shrink-0 ${severityColors[t.estimatedImpact] ?? ""}`}
								>
									{impactLabels[t.estimatedImpact] ?? t.estimatedImpact}
								</span>
							</label>
						))}
				</CardContent>
			</Card>

			{/* <Card>
				<CardHeader>
					<CardTitle>Pontos fracos</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{guide.weaknesses.map((w, i) => (
						<div key={i} className="flex flex-col gap-0.5">
							<div className="flex items-center gap-2">
								<span className="font-medium text-sm">{w.area}</span>
								<span className={`text-xs ${severityColors[w.severity] ?? ""}`}>
									{impactLabels[w.severity] ?? w.severity}
								</span>
							</div>
							<p className="text-xs text-muted-foreground">{w.description}</p>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recomendações</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{guide.recommendations.map((r, i) => (
						<div
							key={i}
							className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0"
						>
							<p className="text-xs text-muted-foreground">{r.criterion}</p>
							<p className="text-sm">{r.recommendation}</p>
							<p className="text-xs text-muted-foreground">
								Situação atual: {r.currentState}
							</p>
						</div>
					))}
				</CardContent>
			</Card>

			 */}
		</div>
	);
}
