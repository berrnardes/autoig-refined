import { QueryProvider } from "@/lib/query-client";
import { ThemeProvider } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autoig.com.br";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "AutoIG — Otimize seu perfil do Instagram com IA",
		template: "%s | AutoIG",
	},
	description:
		"Analise seu perfil do Instagram, compare com concorrentes e receba um relatório com melhorias práticas gerado por IA.",
	keywords: [
		"Instagram",
		"otimização de perfil",
		"análise de concorrentes",
		"IA",
		"marketing digital",
		"engajamento Instagram",
		"bio Instagram",
		"estratégia de conteúdo",
	],
	authors: [{ name: "AutoIG", url: SITE_URL }],
	creator: "AutoIG",
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: SITE_URL,
		siteName: "AutoIG",
		title: "AutoIG — Otimize seu perfil do Instagram com IA",
		description:
			"Analise seu perfil do Instagram, compare com concorrentes e receba um relatório com melhorias práticas gerado por IA.",
	},
	twitter: {
		card: "summary_large_image",
		title: "AutoIG — Otimize seu perfil do Instagram com IA",
		description:
			"Analise seu perfil, compare com concorrentes e receba melhorias práticas geradas por IA.",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true },
	},
	alternates: {
		canonical: SITE_URL,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="pt-BR"
			suppressHydrationWarning
			className={cn("font-mono", jetbrainsMono.variable)}
		>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider>
					<QueryProvider>{children}</QueryProvider>
				</ThemeProvider>
				<Script
					async
					src="https://www.googletagmanager.com/gtag/js?id=G-H254XDCQ0H"
				/>
				<Script
					id="google-analytics"
					dangerouslySetInnerHTML={{
						__html: `
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('config', 'G-H254XDCQ0H');
						`,
					}}
				/>
			</body>
		</html>
	);
}
