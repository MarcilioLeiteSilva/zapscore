part of '../screens.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  void _showTermsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Termos de Uso'),
        content: const SingleChildScrollView(
          child: Text(
            'O aplicativo ZapScore fornece resultados esportivos, estatísticas, notícias e análises preditivas com fins exclusivamente informativos e de entretenimento esportivo. Todos os direitos sobre nomes de clubes, escudos e ligas pertencem aos seus respectivos detentores.',
            style: TextStyle(fontSize: 13, height: 1.4),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  void _showContactDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Suporte e Contato'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dúvidas, sugestões ou suporte técnico?',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Envie uma mensagem diretamente para nossa equipe:\n\n📧 suporte@zapscore.com\n🌐 www.zapscore.com',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Entendi'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sobre o ZapScore'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          Center(
            child: SvgPicture.asset(
              Assets.iconSvg,
              width: 100,
              height: 100,
            ),
          ),
          const Gap(12),
          Center(
            child: Text(
              AppText.appName,
              style: context.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Center(
            child: Text(
              'Versão 1.0.0 (Build 1)',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.6),
              ),
            ),
          ),
          const Gap(16),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Sua central completa de inteligência esportiva, placares ao vivo, estatísticas detalhadas e análises de partidas.',
                textAlign: TextAlign.center,
                style: context.textTheme.bodyMedium?.copyWith(
                  height: 1.4,
                ),
              ),
            ),
          ),
          const Gap(24),
          const Divider(height: 1),
          const Gap(8),

          ListTile(
            leading: Icon(Icons.shield_outlined, color: Theme.of(context).primaryColor),
            title: Text(
              'Política de Privacidade',
              style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('Saiba como protegemos seus dados e privacidade', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              context.pushNamed(screenPrivacyPolicy);
            },
          ),
          const Divider(height: 1, indent: 56),

          ListTile(
            leading: Icon(Icons.tune_rounded, color: Theme.of(context).primaryColor),
            title: Text(
              'Consentimento de Anúncios',
              style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('Gerenciar preferências de privacidade AdMob', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => AdService.showPrivacyOptionsForm(context),
          ),
          const Divider(height: 1, indent: 56),

          ListTile(
            leading: Icon(Icons.description_outlined, color: Theme.of(context).primaryColor),
            title: Text(
              'Termos de Uso',
              style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('Condições e diretrizes de uso do serviço', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showTermsDialog(context),
          ),
          const Divider(height: 1, indent: 56),

          ListTile(
            leading: Icon(Icons.headset_mic_outlined, color: Theme.of(context).primaryColor),
            title: Text(
              'Suporte e Contato',
              style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('Fale conosco: suporte@zapscore.com', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showContactDialog(context),
          ),
          const Divider(height: 1, indent: 56),

          ListTile(
            leading: Icon(Icons.info_outline, color: Theme.of(context).primaryColor),
            title: Text(
              'Desenvolvido por',
              style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('ZapScore Sports Intelligence', style: TextStyle(fontSize: 11)),
          ),
          const Divider(height: 1),

          const Gap(32),
          Center(
            child: Text(
              '© 2026 ZapScore • Todos os direitos reservados',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.5),
                fontSize: 11,
              ),
            ),
          ),
          const Gap(20),
        ],
      ),
    );
  }
}
