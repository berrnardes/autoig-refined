export function ContactSupport({ className }: { className?: string }) {
	return (
		<p className={className ?? "text-xs text-muted-foreground"}>
			Precisa de ajuda?{" "}
			<a
				href="mailto:contato@dalio.io"
				className="underline hover:text-foreground transition-colors"
			>
				contato@dalio.io
			</a>
		</p>
	);
}
