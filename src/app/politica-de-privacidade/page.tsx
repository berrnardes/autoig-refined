import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Política de Privacidade",
	description: "Política de Privacidade da plataforma AutoIG.",
};

export default function PoliticaDePrivacidadePage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-16">
			<Link
				href="/register"
				className="text-sm text-muted-foreground hover:text-foreground"
			>
				← Voltar
			</Link>

			<h1 className="mt-6 text-2xl font-bold tracking-tight">
				Política de Privacidade
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Última atualização: 13 de março de 2026
			</p>

			<div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						1. Dados Coletados
					</h2>
					<p>
						Coletamos as seguintes informações: nome, endereço de e-mail e senha
						(armazenada de forma criptografada) fornecidos no cadastro. Também
						coletamos os nomes de usuário do Instagram informados para análise e
						dados de uso da plataforma (páginas visitadas, avaliações
						realizadas).
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						2. Finalidade do Tratamento
					</h2>
					<p>
						Seus dados são utilizados para: autenticação e gerenciamento da sua
						conta, geração dos relatórios de análise de perfil, processamento de
						pagamentos via Mercado Pago, comunicação sobre o serviço e coleta de
						feedback (conforme autorizado nos Termos de Uso), e melhoria
						contínua da plataforma.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						3. Compartilhamento de Dados
					</h2>
					<p>
						Não vendemos seus dados pessoais. Compartilhamos informações apenas
						com: Mercado Pago (para processamento de pagamentos), OpenAI (dados
						de perfis públicos do Instagram para geração de relatórios) e Apify
						(para coleta de dados públicos do Instagram). Todos os parceiros
						estão sujeitos a suas respectivas políticas de privacidade.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						4. Armazenamento e Segurança
					</h2>
					<p>
						Seus dados são armazenados em servidores seguros com criptografia.
						Senhas são armazenadas utilizando hash criptográfico. Adotamos
						medidas técnicas e organizacionais para proteger seus dados contra
						acesso não autorizado, perda ou destruição.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						5. Seus Direitos (LGPD)
					</h2>
					<p>
						Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você
						tem direito a: acessar seus dados pessoais, corrigir dados
						incompletos ou desatualizados, solicitar a exclusão dos seus dados,
						revogar o consentimento para comunicações e solicitar a
						portabilidade dos seus dados. Para exercer seus direitos, entre em
						contato pelo e-mail contato@autoig.com.br.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						6. Cookies
					</h2>
					<p>
						Utilizamos cookies essenciais para autenticação e manutenção da sua
						sessão. Não utilizamos cookies de rastreamento de terceiros para
						fins publicitários.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						7. Retenção de Dados
					</h2>
					<p>
						Seus dados são mantidos enquanto sua conta estiver ativa. Após a
						exclusão da conta, seus dados pessoais serão removidos em até 30
						dias, exceto quando houver obrigação legal de retenção.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-base font-semibold text-foreground">
						8. Alterações nesta Política
					</h2>
					<p>
						Esta política pode ser atualizada periodicamente. Notificaremos
						sobre alterações significativas por e-mail ou aviso na plataforma.
					</p>
				</section>
			</div>
		</main>
	);
}
