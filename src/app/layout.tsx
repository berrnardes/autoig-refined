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
				<Script
					id="gtm-script"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WZP6DNR2');`,
					}}
				/>
				<noscript>
					<iframe
						src="https://www.googletagmanager.com/ns.html?id=GTM-WZP6DNR2"
						height="0"
						width="0"
						style={{ display: "none", visibility: "hidden" }}
					/>
				</noscript>
				<ThemeProvider>
					<QueryProvider>{children}</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
