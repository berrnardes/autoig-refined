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
import { signUp } from "@/lib/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { error: signUpError } = await signUp.email(
				{ email, password, name },
				{
					onSuccess: () => router.push("/dashboard"),
					onError: () =>
						setError("Não foi possível criar a conta. Tente novamente."),
				},
			);
			if (signUpError) {
				setError("Não foi possível criar a conta. Tente novamente.");
			}
		} catch {
			setError("Não foi possível criar a conta. Tente novamente.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Criar conta</CardTitle>
					<CardDescription>Preencha seus dados para começar</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								type="text"
								placeholder="Seu nome"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="voce@exemplo.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Senha</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
							/>
						</div>
						<label
							htmlFor="terms"
							className="flex items-center gap-2 cursor-pointer"
						>
							<input
								id="terms"
								type="checkbox"
								checked={acceptedTerms}
								onChange={(e) => setAcceptedTerms(e.target.checked)}
								className="h-4 w-4 shrink-0 rounded border border-input accent-[#01337D]"
								required
							/>
							<span className="text-xs text-muted-foreground leading-snug">
								Li e concordo com os{" "}
								<Link
									href="/termos-de-uso"
									target="_blank"
									className="underline hover:text-foreground"
								>
									Termos de Uso
								</Link>{" "}
								e a{" "}
								<Link
									href="/politica-de-privacidade"
									target="_blank"
									className="underline hover:text-foreground"
								>
									Política de Privacidade
								</Link>
								.
							</span>
						</label>
						{error && (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3 mt-4">
						<Button
							type="submit"
							className="w-full"
							disabled={loading || !acceptedTerms}
						>
							{loading ? "Criando..." : "Criar conta"}
						</Button>
						<Link
							href="/login"
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Já tem uma conta? Entrar
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
