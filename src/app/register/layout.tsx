import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Criar conta",
	description:
		"Crie sua conta no AutoIG para começar a otimizar seu perfil do Instagram.",
};

export default function RegisterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
