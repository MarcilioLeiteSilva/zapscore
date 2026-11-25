part of '../screens.dart';

class LgpdScreen extends StatelessWidget {
  const LgpdScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'lgpd'.tr(context),
          style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Campeonato Sul-Mato-Grossense',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.titleMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColor.accent,
                  ),
                ),
              ),
              const Gap(4),
              Text(
                'LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.labelMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              const Gap(12),
              const Divider(),
              const Gap(12),
              Text(
                '''A conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD) é um compromisso prioritário do aplicativo Campeonato Sul-Mato-Grossense, mantido pela Prolaser Dev (Ecossistema ZapScore).

1. DIREITOS DO TITULAR DOS DADOS (ARTIGO 18 DA LGPD)
Nos termos da LGPD, você possui os seguintes direitos garantidos em relação aos seus dados:
- Confirmação da existência de tratamento: saber se tratamos algum dado relacionado ao seu dispositivo;
- Acesso aos dados: obter informações claras sobre dados processados;
- Correção de dados: retificar preferências desatualizadas ou incompletas;
- Eliminação e anonimização: solicitar a exclusão de registros técnicos associados ao seu aparelho;
- Revogação de consentimento: cancelar o recebimento de notificações push ou preferências de anúncios a qualquer instante.

2. BASES LEGAIS DO TRATAMENTO
O tratamento de dados técnicos no aplicativo ocorre estritamente sob:
- Execução dos serviços solicitados pelo usuário (entrega de placares ao vivo, tabela e notificações em tempo real);
- Legítimo interesse do desenvolvedor para garantir a segurança da infraestrutura, prevenção a fraudes em anúncios e monitoramento de estabilidade;
- Consentimento expresso para o envio de notificações push (Android 13+) e preferências de privacidade de anúncios (Google UMP).

3. CANAL DE ATENDIMENTO AO TITULAR DE DADOS (DPO)
Qualquer requisição referente à LGPD pode ser encaminhada diretamente ao Encarregado pelo Tratamento de Dados Pessoais através do e-mail:
contato@prolaserdev.com

Prazo de resposta: em conformidade com o artigo 19 da LGPD, as requisições serão respondidas no prazo regulamentar de até 15 dias corridos.

4. MEDIDAS DE SEGURANÇA E PRIVACIDADE
Adotamos salvaguardas técnicas e administrativas rigorosas, incluindo criptografia de dados em trânsito (HTTPS/TLS) e retenção temporária estritamente necessária ao funcionamento da aplicação esportiva.''',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.bodySmall!.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.85),
                    fontSize: 12,
                    height: 1.55,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
