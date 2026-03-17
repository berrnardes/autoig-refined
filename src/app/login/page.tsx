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
import { signIn } from "@/lib/auth/client";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { error: signInError } = await signIn.email(
				{ email, password },
				{
					onSuccess: () => {
						window.location.href = "/dashboard";
					},
					onError: () => setError("Credenciais inválidas. Tente novamente."),
				},
			);
			if (signInError) {
				setError("Credenciais inválidas. Tente novamente.");
			}
		} catch {
			setError("Credenciais inválidas. Tente novamente.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Entrar</CardTitle>
					<CardDescription>
						Insira suas credenciais para continuar
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="flex flex-col gap-4">
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
						{error && (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3 mt-4">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Entrando..." : "Entrar"}
						</Button>
						<Link
							href="/register"
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Não tem uma conta? Cadastre-se
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
