"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
	const { theme, toggle } = useTheme();
	const [username, setUsername] = useState("");

	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="border-b border-border">
				<div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
					<h1 className="text-lg font-semibold">AutoIG</h1>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggle}
							aria-label={
								theme === "dark"
									? "Mudar para modo claro"
									: "Mudar para modo escuro"
							}
						>
							{theme === "dark" ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 256 256"
									fill="currentColor"
								>
									<path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 256 256"
									fill="currentColor"
								>
									<path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.36A88,88,0,0,1,65.64,67.09,89,89,0,0,1,81.2,40.42C78.56,62.58,86.08,85.19,103.44,102.56S181.42,177.44,215.58,174.8A89,89,0,0,1,188.9,190.36Z" />
								</svg>
							)}
						</Button>
						<Link href="/login">
							<Button variant="ghost" size="sm">
								Entrar
							</Button>
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<div className="space-y-6">
						<h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
							IA que analisa seu perfil do Instagram e mostra exatamente como
							melhorá-lo
						</h2>
						<p className="text-lg text-muted-foreground leading-relaxed">
							O AutoIG analisa seu perfil, compara com contas de alto desempenho
							no seu nicho e gera um relatório com melhorias práticas.
						</p>
						<div className="flex gap-2 max-w-md">
							<Input
								placeholder="@seu_usuario"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="flex-1"
							/>
							<Link href={username ? "/dashboard/evaluate" : "/login"}>
								<Button>Analisar</Button>
							</Link>
						</div>
					</div>
					<div className="flex justify-center lg:justify-end">
						<Image
							src="/peep/peep-with-smartphone.svg"
							alt="Pessoa usando smartphone"
							width={400}
							height={400}
							className="w-full max-w-sm"
						/>
					</div>
				</div>
			</section>

			{/* Problem Section */}
			<section className="bg-muted/30 py-16 sm:py-24">
				<div className="mx-auto max-w-4xl px-4">
					<h3 className="text-3xl font-bold mb-6 text-center">
						A maioria dos perfis no Instagram está mal otimizada
					</h3>
					<p className="text-lg text-muted-foreground mb-8 text-center">
						Muitos perfis têm problemas como:
					</p>
					<div className="grid sm:grid-cols-2 gap-4 mb-8">
						<Card>
							<CardContent className="p-6">
								<p className="text-muted-foreground">Bio fraca ou confusa</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<p className="text-muted-foreground">
									Estratégia de conteúdo inconsistente
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<p className="text-muted-foreground">Hashtags erradas</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<p className="text-muted-foreground">
									Tipos de post que geram pouco engajamento
								</p>
							</CardContent>
						</Card>
						<Card className="sm:col-span-2">
							<CardContent className="p-6">
								<p className="text-muted-foreground">
									Nenhuma ideia do que concorrentes estão fazendo melhor
								</p>
							</CardContent>
						</Card>
					</div>
					<p className="text-lg text-center mb-4">
						A maioria dos criadores e empresas{" "}
						<span className="font-semibold">
							está apenas tentando adivinhar o que funciona
						</span>
						.
					</p>
					<p className="text-lg text-center">
						O AutoIG transforma seu perfil em uma{" "}
						<span className="font-semibold">estratégia baseada em dados</span>.
					</p>
				</div>
			</section>

			{/* How It Works */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
				<h3 className="text-3xl font-bold mb-12 text-center">Como Funciona</h3>
				<div className="grid md:grid-cols-3 gap-8">
					<div className="space-y-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
							1
						</div>
						<h4 className="text-xl font-semibold">Analisamos seu perfil</h4>
						<p className="text-muted-foreground leading-relaxed">
							O AutoIG analisa seu perfil e coleta dados como estrutura da bio,
							frequência de posts, padrões de engajamento e tipo de conteúdo
							publicado.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
							2
						</div>
						<h4 className="text-xl font-semibold">
							Comparamos com concorrentes
						</h4>
						<p className="text-muted-foreground leading-relaxed">
							Analisamos perfis de alto desempenho no seu nicho para identificar{" "}
							<span className="font-semibold">
								padrões e estratégias que funcionam
							</span>
							.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
							3
						</div>
						<h4 className="text-xl font-semibold">
							Geramos seu relatório de melhorias
						</h4>
						<p className="text-muted-foreground leading-relaxed">
							Você recebe um relatório com recomendações claras para melhorar
							bio, estratégia de conteúdo, frequência de posts e posicionamento
							do perfil.
						</p>
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="bg-muted/30 py-16 sm:py-24">
				<div className="mx-auto max-w-4xl px-4">
					<h3 className="text-3xl font-bold mb-4 text-center">
						Pague apenas quando usar
					</h3>
					<p className="text-lg text-muted-foreground mb-12 text-center">
						Cada análise de perfil utiliza{" "}
						<span className="font-semibold">1 crédito</span>.
						<br />
						Você compra créditos quando precisar e pode utilizá-los para
						analisar qualquer perfil.
					</p>
					<Card className="max-w-md mx-auto">
						<CardContent className="p-8 space-y-6">
							<div className="text-center">
								<p className="text-lg font-semibold mb-4">
									1 crédito = 1 análise completa de perfil
								</p>
							</div>
							<div className="space-y-3">
								<div className="flex justify-between items-center py-3 border-b border-border">
									<span className="text-muted-foreground">1 crédito</span>
									<span className="font-semibold">R$ 5</span>
								</div>
								<div className="flex justify-between items-center py-3 border-b border-border">
									<span className="text-muted-foreground">5 créditos</span>
									<span className="font-semibold">R$ 25</span>
								</div>
								<div className="flex justify-between items-center py-3">
									<span className="text-muted-foreground">10 créditos</span>
									<span className="font-semibold">R$ 50</span>
								</div>
							</div>
							<div className="pt-4 border-t border-border">
								<p className="text-sm text-muted-foreground text-center">
									Todo novo usuário recebe{" "}
									<span className="font-semibold">1 crédito gratuito</span> para
									testar a plataforma.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* CTA Section */}
			<section className="mx-auto max-w-4xl px-4 py-16 sm:py-24 text-center">
				<h3 className="text-3xl font-bold mb-6">
					Pronto para otimizar seu perfil?
				</h3>
				<p className="text-lg text-muted-foreground mb-8">
					Comece agora com 1 crédito gratuito
				</p>
				<Link href="/register">
					<Button size="lg">Criar conta grátis</Button>
				</Link>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-8">
				<div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
					<p>© 2026 AutoIG. Todos os direitos reservados.</p>
					<p>
						Desenvolvido por{" "}
						<Link
							className="text-blue-600 underline"
							target="_blank"
							href={"https://www.dalio.io"}
						>
							dalio.io
						</Link>
					</p>
				</div>
			</footer>
		</div>
	);
}
