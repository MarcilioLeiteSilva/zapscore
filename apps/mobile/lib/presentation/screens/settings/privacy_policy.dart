part of '../screens.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Política de Privacidade'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      color: Theme.of(context).primaryColor,
                      size: 28,
                    ),
                    const Gap(10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Compromisso com a Privacidade',
                            style: context.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'ZapScore • Atualizado em Agosto de 2026',
                            style: context.textTheme.bodySmall?.copyWith(
                              color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Gap(12),
                Text(
                  'O ZapScore valoriza a sua privacidade. Esta política descreve como tratamos as informações no aplicativo, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), o Regulamento Geral sobre a Proteção de Dados (GDPR) e as diretrizes da Google Play Store.',
                  style: context.textTheme.bodyMedium?.copyWith(
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const Gap(16),

          // Botão Interativo de Gestão de Consentimento UMP
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.tune_rounded, color: Theme.of(context).primaryColor, size: 26),
                const Gap(12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Privacidade de Anúncios',
                        style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Gerencie seu consentimento e preferências de anúncios.',
                        style: context.textTheme.bodySmall?.copyWith(
                          color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () => AdService.showPrivacyOptionsForm(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Configurar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const Gap(20),

          _buildSection(
            context,
            title: '1. Informações Coletadas e Armazenamento',
            content: 'O ZapScore opera com foco na privacidade e minimização de dados:\n\n'
                '• Dados de Perfil Local: Seu nome, apelido e foto de perfil escolhidos são armazenados exclusivamente de forma local no seu dispositivo (SharedPreferences) e não são enviados a servidores externos de terceiros.\n'
                '• Preferências de Clubes e Ligas: Suas equipes e competições favoritadas são gravadas localmente para personalizar seus placares e notificações.\n'
                '• Notificações Esportivas: O identificador de notificações é utilizado única e exclusivamente para enviar alertas em tempo real sobre início de partidas, gols e novidades do seu time.',
          ),

          _buildSection(
            context,
            title: '2. Uso dos Dados e Finalidade',
            content: 'As informações e preferências configuradas no aplicativo têm como objetivo único:\n\n'
                '• Exibir placares, estatísticas, classificações e análises de IA atualizados em tempo real.\n'
                '• Disparar alertas pontuais sobre jogos e novidades dos seus clubes do coração.\n'
                '• Garantir a usabilidade, desempenho e preferências visuais (tema escuro/claro e idioma).',
          ),

          _buildSection(
            context,
            title: '3. Provedores e Comunicação Segura',
            content: 'Toda a comunicação do aplicativo com nossos servidores é realizada sob criptografia de ponta a ponta através de canal seguro HTTPS.\n\n'
                '• Não comercializamos, não alugamos e não compartilhamos quaisquer dados pessoais com empresas de publicidade terceiras ou corretores de dados.',
          ),

          _buildSection(
            context,
            title: '4. Seus Direitos (LGPD e GDPR)',
            content: 'Você possui total autonomia sobre suas informações:\n\n'
                '• Acesso e Alteração: Você pode editar seu nome, apelido, foto e preferências de notificações a qualquer momento através do menu "Conta / Perfil".\n'
                '• Exclusão de Dados: Como seus dados residem no próprio dispositivo, desinstalar o aplicativo ou limpar os dados do app nas configurações do Android apaga 100% das suas preferências e dados locais instantaneamente.',
          ),

          _buildSection(
            context,
            title: '5. Contato e Suporte',
            content: 'Em caso de dúvidas sobre esta Política de Privacidade ou sobre o aplicativo ZapScore, entre em contato diretamente com nossa equipe de suporte pelo e-mail: suporte@zapscore.com.',
          ),

          const Gap(20),
          Center(
            child: Text(
              'ZapScore Sports Intelligence • Todos os direitos reservados',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.5),
              ),
            ),
          ),
          const Gap(20),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, {required String title, required String content}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: context.textTheme.titleSmall?.copyWith(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Gap(8),
          Text(
            content,
            style: context.textTheme.bodyMedium?.copyWith(
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
