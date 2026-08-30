part of '../screens.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Central de Ajuda'),
          centerTitle: true,
          bottom: TabBar(
            tabs: const [
              Tab(text: 'Dúvidas Frequentes (FAQ)'),
              Tab(text: 'Fale Conosco'),
            ],
            labelStyle: context.textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
            unselectedLabelColor: Theme.of(context).hintColor,
          ),
        ),
        body: const TabBarView(
          children: [
            _FaqPage(),
            _ContactPage(),
          ],
        ),
      ),
    );
  }
}

class _ContactPage extends StatelessWidget {
  const _ContactPage();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
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
              Row(
                children: [
                  Icon(Icons.support_agent_rounded, color: Theme.of(context).primaryColor, size: 28),
                  const Gap(10),
                  Text(
                    'Atendimento ao Torcedor',
                    style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const Gap(8),
              Text(
                'Nossa equipe está disponível para auxiliar você com qualquer dúvida, sugestão ou relato de problema técnico no ZapScore.',
                style: context.textTheme.bodySmall?.copyWith(height: 1.4),
              ),
            ],
          ),
        ),
        const Gap(16),
        _buildContactCard(
          context,
          icon: Icons.email_outlined,
          title: 'E-mail de Suporte',
          subtitle: 'suporte@zapscore.com',
          description: 'Tempo médio de resposta: até 24 horas úteis.',
        ),
        const Gap(12),
        _buildContactCard(
          context,
          icon: Icons.language_outlined,
          title: 'Portal Oficial',
          subtitle: 'www.zapscore.com',
          description: 'Acompanhe novidades, tabelas e estatísticas na web.',
        ),
        const Gap(12),
        _buildContactCard(
          context,
          icon: Icons.security_outlined,
          title: 'Privacidade e Dados (DPO)',
          subtitle: 'privacidade@zapscore.com',
          description: 'Canal dedicado para solicitações sobre a LGPD / GDPR.',
        ),
      ],
    );
  }

  Widget _buildContactCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Theme.of(context).primaryColor, size: 22),
          ),
          const Gap(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                const Gap(2),
                Text(subtitle, style: context.textTheme.bodyMedium?.copyWith(color: Theme.of(context).primaryColor, fontWeight: FontWeight.w600)),
                const Gap(4),
                Text(description, style: context.textTheme.bodySmall?.copyWith(color: context.textTheme.bodySmall?.color?.withValues(alpha: 0.6))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FaqPage extends StatefulWidget {
  const _FaqPage();

  @override
  State<_FaqPage> createState() => _FaqPageState();
}

class _FaqPageState extends State<_FaqPage> {
  int? openFaqIndex;

  final List<Map<String, String>> faqs = [
    {
      'q': 'O que é o ZapScore?',
      'a': 'O ZapScore é um aplicativo esportivo que oferece placares ao vivo, estatísticas de clubes e jogadores, tabelas de classificação atualizadas e previsões estatísticas orientadas por inteligência artificial.',
    },
    {
      'q': 'Como favoritar times e partidas?',
      'a': 'Para favoritar uma partida ou time, toque no ícone de coração disponível nos cards e telas de detalhes. Suas equipes favoritas aparecem destacadas na aba de Favoritos.',
    },
    {
      'q': 'Como funcionam as Análises de IA?',
      'a': 'Nossos algoritmos analisam o histórico recente de confrontos (H2H), aproveitamento recente, gols marcados/sofridos e desempenho dentro e fora de casa para gerar probabilidades estatísticas de vitória, empate e gols.',
    },
    {
      'q': 'Como ativar ou desativar notificações?',
      'a': 'Você pode personalizar os alertas de início de partida, gols e notícias no menu "Conta" > "Notificações", escolhendo exatamente os eventos que deseja receber.',
    },
    {
      'q': 'Como meus dados são protegidos?',
      'a': 'Suas preferências de clubes e fotos de perfil são armazenadas de forma estritamente local no seu celular. Toda a comunicação do app com nossa API é criptografada via HTTPS.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: faqs.length,
      itemBuilder: (context, i) {
        final isOpen = openFaqIndex == i;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: [
              ListTile(
                title: Text(
                  faqs[i]['q']!,
                  style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                trailing: Icon(
                  isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: Theme.of(context).primaryColor,
                ),
                onTap: () {
                  setState(() {
                    openFaqIndex = isOpen ? null : i;
                  });
                },
              ),
              if (isOpen) ...[
                const Divider(height: 1, indent: 16, endIndent: 16),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    faqs[i]['a']!,
                    style: context.textTheme.bodySmall?.copyWith(height: 1.45),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
