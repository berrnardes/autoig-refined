"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEvaluation, useCredits } from "@/lib/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOADING_STEPS = [
	{ label: "Coletando dados do perfil", duration: 4000 },
	{ label: "Analisando concorrentes", duration: 6000 },
	{ label: "Processando métricas", duration: 4000 },
	{ label: "Gerando guia com IA", duration: 8000 },
	{ label: "Avaliando qualidade", duration: 5000 },
	{ label: "Finalizando relatório", duration: 3000 },
];

function EvaluationLoader({ username }: { username: string }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let stepIndex = 0;
		let elapsed = 0;
		const totalDuration = LOADING_STEPS.reduce((s, x) => s + x.duration, 0);

		const interval = setInterval(() => {
			elapsed += 100;
			setProgress(Math.min((elapsed / totalDuration) * 100, 95));

			let acc = 0;
			for (let i = 0; i < LOADING_STEPS.length; i++) {
				acc += LOADING_STEPS[i].duration;
				if (elapsed < acc) {
					stepIndex = i;
					break;
				}
				stepIndex = LOADING_STEPS.length - 1;
			}
			setCurrentStep(stepIndex);
		}, 100);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
			<div className="w-full max-w-sm flex flex-col items-center gap-8">
				{/* Spinner */}
				<div className="relative flex items-center justify-center">
					<div className="h-16 w-16 rounded-full border-4 border-muted" />
					<div className="absolute h-16 w-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
				</div>

				{/* Title */}
				<div className="text-center">
					<p className="text-sm text-muted-foreground mb-1">Avaliando</p>
					<p className="font-semibold text-lg">@{username}</p>
				</div>

				{/* Steps */}
				<div className="w-full flex flex-col gap-2">
					{LOADING_STEPS.map((step, i) => {
						const done = i < currentStep;
						const active = i === currentStep;
						return (
							<div key={step.label} className="flex items-center gap-3">
								<div
									className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-300 ${
										done
											? "bg-primary"
											: active
												? "bg-primary animate-pulse"
												: "bg-muted"
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
									<span className="ml-auto text-xs text-primary">✓</span>
								)}
							</div>
						);
					})}
				</div>

				{/* Progress bar */}
				<div className="w-full h-1 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
						style={{ width: `${progress}%` }}
					/>
				</div>

				<p className="text-xs text-muted-foreground text-center">
					Isso pode levar alguns minutos. Não feche esta página.
				</p>
			</div>
		</div>
	);
}

const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

function validateUsername(value: string): string | null {
	if (!value) return "Nome de usuário é obrigatório";
	if (value.length > 30) return "Máximo de 30 caracteres";
	if (!USERNAME_REGEX.test(value))
		return "Apenas letras, números, pontos e underscores";
	return null;
}

const STEP_LABELS = ["Seu perfil", "Concorrentes", "Confirmar"];

function StepIndicator({ step }: { step: number }) {
	return (
		<div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
			{STEP_LABELS.map((label, i) => (
				<span
					key={label}
					className={i === step ? "text-foreground font-medium" : ""}
				>
					{i > 0 && <span className="mx-1.5">→</span>}
					{label}
				</span>
			))}
		</div>
	);
}

function getSubmitErrorMessage(err: unknown): {
	message: string;
	field?: "username" | "competitors";
} {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (err as any)?.response?.data;
	const raw: string =
		data?.error ??
		(err instanceof Error
			? err.message
			: "Erro ao criar avaliação. Tente novamente.");

	if (raw.includes("private") || raw.includes("privado")) {
		return {
			message: "Este perfil é privado e não pode ser analisado.",
			field: "username",
		};
	}
	if (
		raw.includes("not found") ||
		raw.includes("não encontrado") ||
		raw.includes("does not exist") ||
		raw.includes("INVALID_USERNAME")
	) {
		return {
			message: "Perfil não encontrado. Verifique o nome de usuário.",
			field: "username",
		};
	}
	if (
		raw.includes("competitor") ||
		raw.includes("concorrente") ||
		raw.includes("All competitor")
	) {
		return {
			message: "Um ou mais perfis concorrentes são privados ou não existem.",
			field: "competitors",
		};
	}
	if (
		raw.includes("INSUFFICIENT_CREDITS") ||
		raw.includes("crédito") ||
		raw.includes("credit")
	) {
		return { message: "Créditos insuficientes para realizar a avaliação." };
	}
	return { message: "Erro ao criar avaliação. Tente novamente." };
}

export default function EvaluatePage() {
	const [step, setStep] = useState(0);
	const [username, setUsername] = useState("");
	const [competitors, setCompetitors] = useState([""]);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<{
		message: string;
		field?: "username" | "competitors";
	} | null>(null);
	const [confirmed, setConfirmed] = useState(false);

	const { data: balance, isLoading: creditsLoading } = useCredits();
	const createEvaluation = useCreateEvaluation();

	const hasCredits = (balance ?? 0) >= 1;

	function validateStep0(): boolean {
		const err = validateUsername(username);
		if (err) {
			setErrors({ username: err });
			return false;
		}
		setErrors({});
		return true;
	}

	function validateStep1(): boolean {
		const newErrors: Record<string, string> = {};
		competitors.forEach((c, i) => {
			const err = validateUsername(c);
			if (err) newErrors[`competitor_${i}`] = err;
		});
		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	}

	function handleNext() {
		setSubmitError(null);
		if (step === 0 && validateStep0()) setStep(1);
		else if (step === 1 && validateStep1()) setStep(2);
	}

	function handleBack() {
		setErrors({});
		setSubmitError(null);
		setStep((s) => Math.max(0, s - 1));
	}

	function addCompetitor() {
		if (competitors.length < 3) setCompetitors([...competitors, ""]);
	}

	function removeCompetitor(index: number) {
		if (competitors.length > 1)
			setCompetitors(competitors.filter((_, i) => i !== index));
	}

	function updateCompetitor(index: number, value: string) {
		const updated = [...competitors];
		updated[index] = value;
		setCompetitors(updated);
	}

	function handleSubmit() {
		setSubmitError(null);
		createEvaluation.mutate(
			{ username, competitors },
			{
				onError: (err) => {
					const parsed = getSubmitErrorMessage(err);
					setSubmitError(parsed);
					if (parsed.field === "username") setStep(0);
					else if (parsed.field === "competitors") setStep(1);
				},
			},
		);
	}

	return (
		<div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
			<Link
				href="/dashboard"
				className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block"
			>
				← Voltar
			</Link>
			<StepIndicator step={step} />

			{step === 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Seu perfil</CardTitle>
						<CardDescription>
							Informe seu nome de usuário do Instagram
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-2">
							<Label htmlFor="username">Usuário</Label>
							<div className="flex items-center gap-0">
								<span className="flex h-8 items-center border border-r-0 border-input bg-muted px-2 text-xs text-muted-foreground">
									@
								</span>
								<Input
									id="username"
									placeholder="seu.usuario"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									aria-invalid={!!errors.username}
								/>
							</div>
							{errors.username && (
								<p className="text-xs text-destructive">{errors.username}</p>
							)}
							{submitError?.field === "username" && (
								<p className="text-xs text-destructive">
									{submitError.message}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="justify-end">
						<Button onClick={handleNext}>Próximo</Button>
					</CardFooter>
				</Card>
			)}

			{step === 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Concorrentes</CardTitle>
						<CardDescription>
							Adicione de 1 a 3 perfis concorrentes
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						{competitors.map((c, i) => (
							<div key={i} className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<span className="flex h-8 items-center border border-r-0 border-input bg-muted px-2 text-xs text-muted-foreground">
										@
									</span>
									<Input
										placeholder="concorrente"
										value={c}
										onChange={(e) => updateCompetitor(i, e.target.value)}
										aria-invalid={!!errors[`competitor_${i}`]}
									/>
									{competitors.length > 1 && (
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => removeCompetitor(i)}
											aria-label="Remover concorrente"
										>
											✕
										</Button>
									)}
								</div>
								{errors[`competitor_${i}`] && (
									<p className="text-xs text-destructive">
										{errors[`competitor_${i}`]}
									</p>
								)}
							</div>
						))}
						{competitors.length < 3 && (
							<Button
								variant="outline"
								size="sm"
								onClick={addCompetitor}
								className="self-start"
							>
								+ Adicionar
							</Button>
						)}
						{submitError?.field === "competitors" && (
							<p className="text-xs text-destructive">{submitError.message}</p>
						)}
					</CardContent>
					<CardFooter className="justify-between">
						<Button variant="ghost" onClick={handleBack}>
							Voltar
						</Button>
						<Button onClick={handleNext}>Próximo</Button>
					</CardFooter>
				</Card>
			)}

			{step === 2 && (
				<Card>
					<CardHeader>
						<CardTitle>Confirmar</CardTitle>
						<CardDescription>Revise os dados antes de iniciar</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div>
							<p className="text-xs text-muted-foreground mb-1">Seu perfil</p>
							<p className="font-medium">@{username}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground mb-1">Concorrentes</p>
							<ul className="flex flex-col gap-0.5">
								{competitors.map((c, i) => (
									<li key={i} className="font-medium">
										@{c}
									</li>
								))}
							</ul>
						</div>
						<label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 cursor-pointer dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
							<input
								type="checkbox"
								checked={confirmed}
								onChange={(e) => setConfirmed(e.target.checked)}
								className="mt-0.5 accent-amber-600"
							/>
							<span>
								Confirmo que todos os perfis existem e são públicos. Perfis
								privados ou inexistentes não podem ser analisados.
							</span>
						</label>
						<div className="flex items-center justify-between border-t border-border pt-3">
							<span className="text-xs text-muted-foreground">Custo</span>
							<span className="font-medium">1 crédito</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">Saldo atual</span>
							<span className="font-medium tabular-nums">
								{creditsLoading ? "…" : (balance ?? 0)}
							</span>
						</div>
						{submitError && !submitError.field && (
							<p className="text-xs text-destructive">{submitError.message}</p>
						)}
					</CardContent>
					<CardFooter className="justify-between">
						<Button variant="ghost" onClick={handleBack}>
							Voltar
						</Button>
						{hasCredits ? (
							<Button
								onClick={handleSubmit}
								disabled={createEvaluation.isPending || !confirmed}
							>
								Iniciar avaliação
							</Button>
						) : (
							<Link href="/dashboard">
								<Button variant="outline">Comprar créditos</Button>
							</Link>
						)}
					</CardFooter>
				</Card>
			)}
		</div>
	);
}
