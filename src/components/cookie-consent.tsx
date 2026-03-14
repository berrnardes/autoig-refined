"use client";

import { Button } from "@/components/ui/button";
import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";
const GTM_ID = "GTM-WZP6DNR2";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
	const [consent, setConsent] = useState<Consent>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem(CONSENT_KEY) as Consent;
		if (stored) {
			setConsent(stored);
		} else {
			setVisible(true);
		}
	}, []);

	function handleAccept() {
		localStorage.setItem(CONSENT_KEY, "accepted");
		setConsent("accepted");
		setVisible(false);
	}

	function handleReject() {
		localStorage.setItem(CONSENT_KEY, "rejected");
		setConsent("rejected");
		setVisible(false);
	}

	return (
		<>
			{consent === "accepted" && (
				<>
					<Script
						id="gtm-script"
						strategy="afterInteractive"
						dangerouslySetInnerHTML={{
							__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
						}}
					/>
					<noscript>
						<iframe
							src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
							height="0"
							width="0"
							style={{ display: "none", visibility: "hidden" }}
						/>
					</noscript>
				</>
			)}

			{visible && (
				<div
					role="dialog"
					aria-label="Consentimento de cookies"
					className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
				>
					<div className="fixed inset-0 bg-black/40" aria-hidden="true" />
					<div className="relative w-full max-w-md border border-border bg-background p-6 shadow-lg">
						<h2 className="text-sm font-semibold text-foreground">
							Usamos cookies
						</h2>
						<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
							Utilizamos cookies e tecnologias semelhantes, incluindo o Google
							Tag Manager, para analisar o tráfego e melhorar sua experiência.
							Ao aceitar, você concorda com o uso dessas tecnologias. Consulte
							nossa{" "}
							<a
								href="/politica-de-privacidade"
								className="underline underline-offset-2 hover:text-foreground"
							>
								Política de Privacidade
							</a>{" "}
							para mais detalhes.
						</p>
						<div className="mt-4 flex gap-2">
							<Button onClick={handleAccept} size="sm">
								Aceitar
							</Button>
							<Button onClick={handleReject} variant="outline" size="sm">
								Recusar
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
