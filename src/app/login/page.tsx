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
import { signIn, signUp } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (isSignUp) {
				const { error: signUpError } = await signUp.email(
					{
						email,
						password,
						name,
					},
					{
						onSuccess: () => router.push("/dashboard"),
						onError: () => setError("Invalid credentials. Please try again."),
					},
				);
				if (signUpError) {
					setError("Invalid credentials. Please try again.");
				}
			} else {
				const { error: signInError } = await signIn.email(
					{
						email,
						password,
					},
					{
						onSuccess: () => router.push("/dashboard"),
						onError: () => setError("Invalid credentials. Please try again."),
					},
				);
				if (signInError) {
					setError("Invalid credentials. Please try again.");
				}
			}
		} catch {
			setError("Invalid credentials. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{isSignUp ? "Create account" : "Sign in"}</CardTitle>
					<CardDescription>
						{isSignUp
							? "Enter your details to get started"
							: "Enter your credentials to continue"}
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="flex flex-col gap-4">
						{isSignUp && (
							<div className="flex flex-col gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									type="text"
									placeholder="Your name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
						)}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
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
					<CardFooter className="flex flex-col gap-3  mt-4">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
						</Button>
						<button
							type="button"
							className="text-sm text-muted-foreground hover:text-foreground"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError("");
							}}
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
