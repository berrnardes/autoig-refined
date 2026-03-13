import type { GuideContent } from "@/types";
import {
	Document,
	Font,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import path from "node:path";

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
	family: "JetBrainsMono",
	fonts: [
		{
			src: path.join(fontsDir, "JetBrainsMono-Regular.ttf"),
			fontWeight: "medium",
		},
		{
			src: path.join(fontsDir, "JetBrainsMono-SemiBold.ttf"),
			fontWeight: "semibold",
		},
		{
			src: path.join(fontsDir, "JetBrainsMono-ExtraBold.ttf"),
			fontWeight: "ultrabold",
		},
	],
});

const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 11,
		fontFamily: "JetBrainsMono",
		fontWeight: "medium",
		lineHeight: 1.5,
	},
	title: {
		fontSize: 22,
		marginBottom: 30,
		fontFamily: "JetBrainsMono",
		fontWeight: "ultrabold",
		color: "#121112",
	},
	checkbox: {
		width: 10,
		height: 10,
		border: "1 solid #999",
		marginRight: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: "JetBrainsMono",
		fontWeight: "semibold",
		marginTop: 16,
		marginBottom: 16,
		color: "#121112",
	},
	summary: {
		marginBottom: 16,
		color: "#333",
		fontFamily: "JetBrainsMono",
		fontWeight: "medium",
	},
	weaknessItem: {
		marginBottom: 8,
		padding: 8,
		backgroundColor: "#f9f9f9",
		borderRadius: 4,
	},
	severityHigh: { color: "#dc2626", fontFamily: "JetBrainsMono", fontSize: 9 },
	severityMedium: {
		color: "#d97706",
		fontFamily: "JetBrainsMono",
		fontSize: 9,
	},
	severityLow: { color: "#2563eb", fontFamily: "JetBrainsMono", fontSize: 9 },
	recItem: { marginBottom: 10, padding: 8, borderBottom: "1 solid #e5e5e5" },
	recCriterion: {
		fontFamily: "JetBrainsMono",
		fontWeight: "semibold",
		fontSize: 11,
		marginBottom: 2,
	},
	recCurrent: { color: "#666", fontSize: 10, marginBottom: 2 },
	recText: { color: "#333" },
	taskItem: { marginBottom: 6, flexDirection: "row" as const },
	taskPriority: {
		width: 24,
		fontFamily: "JetBrainsMono",
		color: "#666",
		fontSize: 10,
	},
	taskText: { flex: 1 },
	impactBadge: { fontSize: 9, fontFamily: "JetBrainsMono", marginLeft: 8 },
	scoreContainer: {
		flexDirection: "row" as const,
		alignItems: "flex-end" as const,
		marginBottom: 16,
		padding: 12,
		backgroundColor: "#f4f4f5",
		borderRadius: 1,
	},
	scoreValue: {
		fontSize: 32,
		fontFamily: "JetBrainsMono",
		marginBottom: "15px",
		color: "#121112",
		marginRight: 12,
	},
	scoreLabel: { fontSize: 10, color: "#666", marginBottom: "-5px" },
	tableRow: {
		flexDirection: "row" as const,
		borderBottom: "1 solid #e5e5e5",
		paddingVertical: 6,
	},
	tableHeader: {
		fontFamily: "JetBrainsMono",
		fontWeight: "semibold",
		fontSize: 10,
		color: "#121112",
	},
	tableCell: { flex: 1, fontSize: 10, fontFamily: "JetBrainsMono" },
	suggestionItem: {
		marginBottom: 8,
		padding: 8,
		backgroundColor: "#f0f4ff",
		borderRadius: 4,
	},
	suggestionType: {
		fontFamily: "JetBrainsMono",
		fontSize: 10,
		color: "#01337D",
		marginBottom: 2,
	},
	suggestionDesc: { color: "#333", fontSize: 10 },
	footer: {
		position: "absolute" as const,
		bottom: 30,
		left: 40,
		right: 40,
		fontSize: 8,
		color: "#999",
		textAlign: "center" as const,
	},
});

const severityStyle = {
	high: styles.severityHigh,
	medium: styles.severityMedium,
	low: styles.severityLow,
};

const impactColor = { high: "#dc2626", medium: "#d97706", low: "#2563eb" };

const ptBRLabel = { high: "alto", medium: "médio", low: "baixo" } as const;

export function createGuideDocument(guide: GuideContent) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<Text style={styles.title}>Autoig - Guia de Otimização</Text>

				<View style={styles.scoreContainer}>
					<Text
						style={[
							styles.scoreValue,
							{
								color:
									guide.profileScore > 80
										? "#2563eb"
										: guide.profileScore > 50
											? "#d97706"
											: "#dc2626",
							},
						]}
					>
						{guide.profileScore}
					</Text>
					<Text style={styles.scoreLabel}>Pontuação do Perfil (0–100)</Text>
				</View>

				<Text style={styles.sectionTitle}>Resumo</Text>
				<Text style={styles.summary}>{guide.summary}</Text>

				<Text style={styles.sectionTitle}>Comparação de Desempenho</Text>
				<View style={styles.tableRow}>
					<Text style={[styles.tableCell, styles.tableHeader]}>Métrica</Text>
					<Text style={[styles.tableCell, styles.tableHeader]}>Você</Text>
					<Text style={[styles.tableCell, styles.tableHeader]}>
						Concorrentes
					</Text>
				</View>
				{guide.performanceComparison.map((p, i) => (
					<View key={i} style={styles.tableRow}>
						<Text style={[styles.tableCell, { fontFamily: "JetBrainsMono" }]}>
							{p.metric}
						</Text>
						<Text style={styles.tableCell}>{p.userValue}</Text>
						<Text style={styles.tableCell}>{p.competitorValue}</Text>
					</View>
				))}

				<Text style={styles.sectionTitle}>Principais Fraquezas</Text>
				{guide.weaknesses.map((w, i) => (
					<View key={i} style={styles.weaknessItem}>
						<Text style={severityStyle[w.severity]}>
							[{ptBRLabel[w.severity].toUpperCase()}] {w.area}
						</Text>
						<Text>{w.description}</Text>
					</View>
				))}

				<Text style={styles.sectionTitle}>Recomendações</Text>
				{guide.recommendations.map((r, i) => (
					<View key={i} style={styles.recItem}>
						<Text style={styles.recCriterion}>
							{r.priority}. {r.criterion}
						</Text>
						<Text style={styles.recCurrent}>Atual: {r.currentState}</Text>
						<Text style={styles.recText}>{r.recommendation}</Text>
					</View>
				))}

				<Text style={styles.sectionTitle}>
					Sugestões de Estratégia de Conteúdo
				</Text>
				{guide.contentStrategySuggestions.map((s, i) => (
					<View key={i} style={styles.suggestionItem}>
						<Text style={styles.suggestionType}>{s.type}</Text>
						<Text style={styles.suggestionDesc}>{s.description}</Text>
					</View>
				))}

				<Text style={styles.sectionTitle}>Plano de Ação</Text>
				{guide.taskList.map((t, i) => (
					<View key={i} style={styles.taskItem}>
						<View style={styles.checkbox} />
						<Text style={styles.taskText}>{t.task}</Text>
						<Text
							style={[
								styles.impactBadge,
								{ color: impactColor[t.estimatedImpact] },
							]}
						>
							{ptBRLabel[t.estimatedImpact]}
						</Text>
					</View>
				))}

				<Text style={styles.footer}>
					Gerado por Instagram Profile Optimizer •{" "}
					{new Date().toLocaleDateString("pt-BR")}
				</Text>
			</Page>
		</Document>
	);
}
