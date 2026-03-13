import { createGuideDocument } from "@/lib/guide-pdf-document";
import type { GuideContent } from "@/types";
import { renderToBuffer } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";

const sampleGuide: GuideContent = {
	profileScore: 62,
	summary:
		"Seu perfil tem uma base sólida de seguidores, mas a taxa de engajamento está abaixo da média dos concorrentes. A bio precisa de mais clareza sobre sua proposta de valor e os destaques estão subutilizados. Há oportunidades significativas em consistência de postagem e diversificação de formatos de conteúdo.",
	performanceComparison: [
		{ metric: "Seguidores", userValue: "12.4K", competitorValue: "28.7K" },
		{
			metric: "Taxa de Engajamento",
			userValue: "1.8%",
			competitorValue: "3.4%",
		},
		{ metric: "Posts/Semana", userValue: "2.1", competitorValue: "4.5" },
		{ metric: "Média de Curtidas", userValue: "223", competitorValue: "976" },
		{ metric: "Média de Comentários", userValue: "12", competitorValue: "45" },
	],
	weaknesses: [
		{
			area: "Frequência de Postagem",
			description:
				"Você posta em média 2.1 vezes por semana, enquanto seus concorrentes postam 4.5 vezes. Essa diferença reduz sua visibilidade no algoritmo.",
			severity: "high",
		},
		{
			area: "Bio e Proposta de Valor",
			description:
				"Sua bio não comunica claramente o que você oferece. Falta um CTA e link estratégico.",
			severity: "high",
		},
		{
			area: "Diversidade de Conteúdo",
			description:
				"90% do seu conteúdo é imagem estática. Reels e carrosséis geram 2-3x mais engajamento no momento.",
			severity: "medium",
		},
		{
			area: "Uso de Hashtags",
			description:
				"Você usa hashtags muito genéricas com alta concorrência. Hashtags de nicho trariam mais alcance qualificado.",
			severity: "medium",
		},
	],
	recommendations: [
		{
			criterion: "Clareza e Posicionamento da Bio",
			currentState: "Bio genérica sem CTA ou proposta clara",
			recommendation:
				"Reescreva a bio com: linha 1 = quem você é, linha 2 = o que você oferece, linha 3 = CTA claro. Adicione um link agregador (Linktree ou similar).",
			priority: 1,
		},
		{
			criterion: "Estratégia de Conteúdo",
			currentState: "90% imagens estáticas, sem diversificação de formatos",
			recommendation:
				"Migre para um mix de 40% Reels, 30% Carrosséis e 30% imagens. Reels curtos (15-30s) com gancho nos primeiros 3 segundos.",
			priority: 2,
		},
		{
			criterion: "Consistência de Postagens",
			currentState: "2.1 posts/semana, sem calendário definido",
			recommendation:
				"Aumente para pelo menos 4 posts por semana com um calendário editorial. Alterne entre Reels (2x), Carrosséis (1x) e Posts estáticos (1x).",
			priority: 3,
		},
		{
			criterion: "Proposta de Valor",
			currentState: "Valor transmitido de forma genérica nos posts e bio",
			recommendation:
				"Destaque nos conteúdos e na bio os diferenciais exclusivos do seu produto/serviço. Use depoimentos e resultados reais para reforçar credibilidade.",
			priority: 4,
		},
		{
			criterion: "Destaques e Links",
			currentState: "Destaques desorganizados e sem link estratégico na bio",
			recommendation:
				"Organize os destaques por tema (Sobre, Depoimentos, Produtos, FAQ). Adicione um link agregador na bio com páginas de conversão.",
			priority: 5,
		},
	],
	contentStrategySuggestions: [
		{
			type: "Reels Educativos",
			description:
				"Crie Reels de 15-30s com dicas rápidas do seu nicho. Use texto na tela e legendas para acessibilidade. Poste entre 18h-20h nos dias úteis.",
		},
		{
			type: "Carrosséis de Valor",
			description:
				"Publique carrosséis com 7-10 slides sobre temas relevantes. Use design consistente com sua identidade visual. Inclua CTA no último slide.",
		},
		{
			type: "Stories Interativos",
			description:
				"Use enquetes, caixas de perguntas e quizzes nos Stories diariamente. Isso aumenta o engajamento e sinaliza relevância para o algoritmo.",
		},
	],
	taskList: [
		{
			task: "Reescrever bio com proposta de valor clara e CTA",
			priority: "high",
			estimatedImpact: "high",
		},
		{
			task: "Criar calendário editorial semanal com 4+ posts",
			priority: "high",
			estimatedImpact: "high",
		},
		{
			task: "Gravar 3 Reels curtos esta semana",
			priority: "high",
			estimatedImpact: "high",
		},
		{
			task: "Pesquisar e montar 3 grupos de hashtags de nicho",
			priority: "medium",
			estimatedImpact: "medium",
		},
		{
			task: "Configurar destaques organizados por tema",
			priority: "medium",
			estimatedImpact: "medium",
		},
		{
			task: "Adicionar link agregador na bio",
			priority: "medium",
			estimatedImpact: "low",
		},
		{
			task: "Analisar melhores horários de postagem no Insights",
			priority: "low",
			estimatedImpact: "medium",
		},
	],
};

async function main() {
	const document = createGuideDocument(sampleGuide);
	const buffer = await renderToBuffer(document);

	const outputPath = "test-guide-output.pdf";
	writeFileSync(outputPath, buffer);
	console.log(`PDF generated: ${outputPath} (${buffer.byteLength} bytes)`);
}

main().catch(console.error);
