part of '../screens.dart';

class SecurityScreen extends StatelessWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Segurança e Dados'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.lock_outline_rounded, color: Theme.of(context).primaryColor, size: 26),
                    const Gap(10),
                    Text(
                      'Privacidade por Design',
                      style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const Gap(8),
                Text(
                  'O ZapScore não exige criação de senhas em servidores de terceiros. Todos os seus dados de preferências e favoritos são gravados localmente no armazenamento seguro do seu celular.',
                  style: context.textTheme.bodySmall?.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
          const Gap(20),

          ListTile(
            leading: const Icon(Icons.https_outlined, color: Colors.green),
            title: const Text('Comunicação Criptografada (HTTPS)'),
            subtitle: const Text('Todas as requisições utilizam TLS/SSL seguro', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 20),
          ),
          const Divider(height: 1),

          ListTile(
            leading: const Icon(Icons.phone_android_rounded, color: Colors.blue),
            title: const Text('Armazenamento Local Isolado'),
            subtitle: const Text('Dados de perfil restritos ao aplicativo', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.check_circle_rounded, color: Colors.blue, size: 20),
          ),
          const Divider(height: 1),

          ListTile(
            leading: Icon(Icons.shield_outlined, color: Theme.of(context).primaryColor),
            title: const Text('Política de Privacidade'),
            subtitle: const Text('Consulte seus direitos sob a LGPD e GDPR', style: TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => context.pushNamed(screenPrivacyPolicy),
          ),
          const Divider(height: 1),

          const Gap(32),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.delete_sweep_rounded, color: Colors.redAccent, size: 22),
                    Gap(8),
                    Text(
                      'Gerenciamento de Dados Locais',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent),
                    ),
                  ],
                ),
                const Gap(8),
                const Text(
                  'Deseja apagar todas as preferências, fotos e dados gravados neste aparelho?',
                  style: TextStyle(fontSize: 12, height: 1.4),
                ),
                const Gap(12),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Limpar Dados Locais'),
                        content: const Text(
                          'Isso apagará seu nome de exibição, foto e preferências de clubes neste aparelho. Deseja prosseguir?',
                          style: TextStyle(fontSize: 13),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('Cancelar'),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: () async {
                              Navigator.pop(ctx);
                              final prefs = await SharedPreferences.getInstance();
                              await prefs.clear();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Dados locais redefinidos com sucesso.')),
                                );
                                context.pop();
                              }
                            },
                            child: const Text('Sim, Limpar'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: const Text('Redefinir Dados do Aplicativo'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
