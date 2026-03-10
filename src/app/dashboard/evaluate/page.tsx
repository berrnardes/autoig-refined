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
import { useState } from "react";

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

export default function EvaluatePage() {
	const [step, setStep] = useState(0);
	const [username, setUsername] = useState("");
	const [competitors, setCompetitors] = useState([""]);
	const [errors, setErrors] = useState<Record<string, string>>({});

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
		if (step === 0 && validateStep0()) setStep(1);
		else if (step === 1 && validateStep1()) setStep(2);
	}

	function handleBack() {
		setErrors({});
		setStep((s) => Math.max(0, s - 1));
	}

	function addCompetitor() {
		if (competitors.length < 5) setCompetitors([...competitors, ""]);
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
		createEvaluation.mutate({ username, competitors });
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
							Adicione de 1 a 5 perfis concorrentes
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
						{competitors.length < 5 && (
							<Button
								variant="outline"
								size="sm"
								onClick={addCompetitor}
								className="self-start"
							>
								+ Adicionar
							</Button>
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
						{createEvaluation.error && (
							<p className="text-xs text-destructive">
								{(createEvaluation.error as Error).message ||
									"Erro ao criar avaliação. Tente novamente."}
							</p>
						)}
					</CardContent>
					<CardFooter className="justify-between">
						<Button variant="ghost" onClick={handleBack}>
							Voltar
						</Button>
						{hasCredits ? (
							<Button
								onClick={handleSubmit}
								disabled={createEvaluation.isPending}
							>
								{createEvaluation.isPending
									? "Iniciando…"
									: "Iniciar avaliação"}
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
