import type { GuideContent } from "@/types";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
	page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
	title: { fontSize: 22, marginBottom: 20, fontFamily: "Helvetica-Bold" },
	sectionTitle: {
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
		marginTop: 18,
		marginBottom: 8,
		color: "#1a1a1a",
	},
	summary: { marginBottom: 16, color: "#333" },
	weaknessItem: {
		marginBottom: 8,
		padding: 8,
		backgroundColor: "#f9f9f9",
		borderRadius: 4,
	},
	severityHigh: { color: "#dc2626", fontFamily: "Helvetica-Bold", fontSize: 9 },
	severityMedium: {
		color: "#d97706",
		fontFamily: "Helvetica-Bold",
		fontSize: 9,
	},
	severityLow: { color: "#2563eb", fontFamily: "Helvetica-Bold", fontSize: 9 },
	recItem: { marginBottom: 10, padding: 8, borderBottom: "1 solid #e5e5e5" },
	recCriterion: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
	recCurrent: { color: "#666", fontSize: 10, marginBottom: 2 },
	recText: { color: "#333" },
	taskItem: { marginBottom: 6, flexDirection: "row" as const },
	taskPriority: {
		width: 24,
		fontFamily: "Helvetica-Bold",
		color: "#666",
		fontSize: 10,
	},
	taskText: { flex: 1 },
	impactBadge: { fontSize: 9, fontFamily: "Helvetica-Bold", marginLeft: 8 },
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

export function createGuideDocument(guide: GuideContent) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<Text style={styles.title}>
					Guia de Otimização de Perfil do Instagram
				</Text>

				<Text style={styles.sectionTitle}>Resumo</Text>
				<Text style={styles.summary}>{guide.summary}</Text>

				<Text style={styles.sectionTitle}>Principais Fraquezas</Text>
				{guide.weaknesses.map((w, i) => (
					<View key={i} style={styles.weaknessItem}>
						<Text style={severityStyle[w.severity]}>
							[{w.severity.toUpperCase()}] {w.area}
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

				<Text style={styles.sectionTitle}>Plano de Ação</Text>
				{guide.taskList.map((t, i) => (
					<View key={i} style={styles.taskItem}>
						<Text style={styles.taskPriority}>{t.priority}.</Text>
						<Text style={styles.taskText}>{t.task}</Text>
						<Text
							style={[
								styles.impactBadge,
								{ color: impactColor[t.estimatedImpact] },
							]}
						>
							{t.estimatedImpact}
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
