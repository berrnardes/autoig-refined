"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body>
				<div style={{ padding: "2rem", textAlign: "center" }}>
					<h2>Algo deu errado</h2>
					<button onClick={() => reset()} style={{ marginTop: "1rem" }}>
						Tentar novamente
					</button>
					<p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
						Se o problema persistir, entre em contato:{" "}
						<a href="mailto:contato@dalio.io" style={{ textDecoration: "underline" }}>
							contato@dalio.io
						</a>
					</p>
				</div>
			</body>
		</html>
	);
}
