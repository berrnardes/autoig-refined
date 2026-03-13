import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Entrar",
	description:
		"Faça login ou crie sua conta no AutoIG para começar a otimizar seu perfil do Instagram.",
};

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
