part of '../screens.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'privacy_policy'.tr(context),
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
                AppText.appName,
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.titleMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColor.accent,
                  ),
                ),
              ),
              const Gap(4),
              Text(
                'POLÍTICA DE PRIVACIDADE',
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
                '''1. INTRODUÇÃO
O Zapscore Football está comprometido com a proteção da privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as suas informações ao utilizar nosso aplicativo.

2. INFORMAÇÕES COLETADAS
- Dados de Dispositivo: Modelo, sistema operacional e identificador único de notificação (Token FCM).
- Preferências de Uso: Clubes favoritos, preferências de notificações ativadas e idioma selecionado.
- Dados de Conta (opcional): Nome e identificadores fornecidos voluntariamente.

3. USO DAS INFORMAÇÕES
Utilizamos seus dados para:
- Enviar notificações em tempo real de gols, partidas e notícias dos seus times favoritos.
- Personalizar o conteúdo e a experiência dentro do aplicativo.
- Garantir a segurança e a estabilidade da aplicação.

4. COMPARTILHAMENTO DE DADOS
Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais. Dados anonimizados podem ser processados por provedores de infraestrutura (serviços de nuvem e notificações push).

5. SEGURANÇA DOS DADOS
Empregamos medidas técnicas e organizacionais avançadas de criptografia para proteger seus dados contra acesso não autorizado.

6. CONTATO E SUPORTE
Dúvidas sobre nossa política de privacidade podem ser sanadas através dos canais oficiais de suporte do Zapscore Football.''',
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
