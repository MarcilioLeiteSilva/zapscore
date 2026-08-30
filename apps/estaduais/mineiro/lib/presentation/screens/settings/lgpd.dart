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
                'Zapscore Football',
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
                '''A conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD) é uma prioridade fundamental para o Zapscore Football.

1. DIREITOS DO TITULAR DOS DADOS
Nos termos da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
- Confirmação da existência de tratamento de dados.
- Acesso fácil e transparente aos dados armazenados.
- Correção de dados incompletos, inexatos ou desatualizados.
- Anonimização, bloqueio ou eliminação de dados desnecessários.
- Revogação do consentimento a qualquer momento.

2. TRATAMENTO E BASE LEGAL
O tratamento de dados no Zapscore Football ocorre com base no legítimo interesse para a prestação dos serviços esportivos em tempo real e na execução dos termos de uso do aplicativo.

3. SOLICITAÇÃO E EXCLUSÃO DE DADOS
O usuário pode a qualquer momento alterar suas preferências ou solicitar a exclusão de seu cadastro e preferências armazenadas enviando uma requisição pelas configurações do aplicativo.

4. SEGURANÇA E PRIVACIDADE
Adotamos os melhores padrões de segurança da informação para garantir a privacidade e inviolabilidade das suas preferências no aplicativo.''',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.bodySmall!.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.85),
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
