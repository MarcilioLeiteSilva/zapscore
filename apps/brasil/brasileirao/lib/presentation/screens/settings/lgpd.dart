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
            color: const Color(0xFF454444),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Brasileirão 2026',
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
                '''A conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD) é uma prioridade fundamental do aplicativo Brasileirão 2026 (com.prolaser.futebolbrasileirobr), desenvolvido por Prolaser Dev.

1. DIREITOS DO TITULAR DOS DADOS (ART. 18 DA LGPD)
Nos termos da LGPD, você possui os seguintes direitos garantidos:
- Confirmação da existência de tratamento de dados técnicos do dispositivo;
- Acesso transparente às informações tratadas (Token FCM, Identificador de Publicidade AAID e preferências locais);
- Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;
- Informação sobre as entidades públicas e privadas (Google Play Services, Google AdMob / UMP e Firebase Cloud Messaging) com as quais há uso compartilhado de identificadores técnicos;
- Revogação do consentimento de notificações e de personalização de anúncios a qualquer momento.

2. BASES LEGAIS DO TRATAMENTO
- Consentimento do Titular (Art. 7º, I): Aplicável ao envio opcional de notificações push (POST_NOTIFICATIONS) e às preferências de anúncios gerenciadas via Google UMP (User Messaging Platform);
- Legítimo Interesse e Execução do Serviço (Art. 7º, V e IX): Aplicável à entrega em tempo real de placares, tabelas, escalações, segurança HTTPS/TLS e diagnóstico de estabilidade.

3. CONTROLE DIRETO E EXCLUSÃO DE DADOS
Como o aplicativo não exige cadastro pessoal (nome, CPF, telefone ou senha), você exerce controle imediato:
- Revogando ou alterando o consentimento publicitário em Configurações > Sobre > Privacidade de Anúncios (Consentimento);
- Desativando notificações push nas configurações do aplicativo ou do Android;
- Limpando o armazenamento local ou desinstalando o aplicativo.

4. CANAL DE ATENDIMENTO AO TITULAR / ENCARREGADO (DPO)
Responsável: Prolaser Dev (Ecossistema ZapScore)
E-mail oficial para solicitações LGPD: contato@prolaserdev.com (prazo de resposta em até 15 dias).''',
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
