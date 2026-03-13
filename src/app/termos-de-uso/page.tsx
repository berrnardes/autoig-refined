import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Termos de Uso",
	description: "Termos de Uso da plataforma AutoIG.",
};

export default function TermosDeUsoPage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-16">
			<Link
				href="/register"
				className="text-sm text-muted-foreground hover:text-foreground"
			>
				← Voltar
			</Link>

			<h1 className="mt-6 text-2xl font-bold tracking-tight">Termos de Uso</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Última atualização: 13 de março de 2026
			</p>

			<div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						1. Aceitação dos Termos
					</h2>
					<p>
						Ao criar uma conta ou utilizar os serviços da AutoIG, você concorda
						integralmente com estes Termos de Uso. Caso não concorde, não
						utilize a plataforma.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						2. Descrição do Serviço
					</h2>
					<p>
						A AutoIG é uma ferramenta SaaS que utiliza inteligência artificial
						para analisar perfis do Instagram, compará-los com concorrentes e
						gerar relatórios de otimização em formato PDF. O serviço funciona
						com base em créditos adquiridos pelo usuário.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						3. Cadastro e Conta
					</h2>
					<p>
						Você é responsável por manter a confidencialidade das suas
						credenciais de acesso. Todas as atividades realizadas na sua conta
						são de sua responsabilidade. Você deve fornecer informações
						verdadeiras e atualizadas no momento do cadastro.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						4. Créditos e Pagamentos
					</h2>
					<p>
						Os créditos adquiridos são utilizados para gerar avaliações. Os
						pagamentos são processados via Mercado Pago (Pix). Créditos não são
						reembolsáveis após o uso. A AutoIG reserva-se o direito de alterar
						os preços dos pacotes de créditos a qualquer momento, sem aviso
						prévio.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						5. Uso Adequado
					</h2>
					<p>
						Você concorda em não utilizar a plataforma para fins ilegais, não
						tentar acessar contas de outros usuários, não realizar engenharia
						reversa do serviço e não sobrecarregar intencionalmente a
						infraestrutura da plataforma.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						6. Propriedade Intelectual
					</h2>
					<p>
						Todo o conteúdo da plataforma, incluindo textos, design, código e
						marca, é de propriedade da AutoIG. Os relatórios gerados são de uso
						pessoal do usuário que os adquiriu.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						7. Contato para Feedback
					</h2>
					<p>
						Ao aceitar estes Termos de Uso, você autoriza a equipe da AutoIG a
						entrar em contato com você, por e-mail ou outros meios de
						comunicação fornecidos no cadastro, com o objetivo de coletar
						feedback sobre o serviço, realizar pesquisas de satisfação e
						comunicar melhorias na plataforma. Você pode revogar essa
						autorização a qualquer momento entrando em contato pelo e-mail
						contato@autoig.com.br.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						8. Limitação de Responsabilidade
					</h2>
					<p>
						A AutoIG não garante resultados específicos de crescimento ou
						engajamento no Instagram. Os relatórios são gerados por inteligência
						artificial e têm caráter orientativo. A plataforma não se
						responsabiliza por decisões tomadas com base nos relatórios gerados.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						9. Modificações dos Termos
					</h2>
					<p>
						A AutoIG pode alterar estes Termos a qualquer momento. As alterações
						entram em vigor na data de publicação. O uso continuado da
						plataforma após alterações constitui aceitação dos novos termos.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						10. Foro
					</h2>
					<p>
						Fica eleito o foro da comarca de domicílio do usuário para dirimir
						quaisquer controvérsias decorrentes destes Termos, conforme o Código
						de Defesa do Consumidor.
					</p>
				</section>
			</div>
		</main>
	);
}
