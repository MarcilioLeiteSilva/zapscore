part of '../screens.dart';

class GeneralScreen extends StatelessWidget {
  const GeneralScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'general'.tr(context),
          style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 10),
        children: [
          ListTile(
            leading: const Icon(Icons.language, color: Colors.red),
            title: Text(
              'languages'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenLanguages);
            },
          ),
          ListTile(
            leading: const Icon(Icons.share, color: Colors.red),
            title: Text(
              'share'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () async {
              try {
                await Share.share(
                  'Acompanhe todos os jogos, gols e notícias do Brasileirão em tempo real no ZapScore!\nhttps://play.google.com/store/apps/details?id=com.prolaser.futebolbrasileirobr',
                );
              } catch (e) {
                final Uri url = Uri.parse('https://play.google.com/store/apps/details?id=com.prolaser.futebolbrasileirobr');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.star_rate_rounded, color: Colors.red),
            title: Text(
              'rate'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () async {
              final Uri url = Uri.parse('https://play.google.com/store/apps/details?id=com.prolaser.futebolbrasileirobr');
              if (await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete_outline_rounded, color: Colors.red),
            title: Text(
              'delete_app_data'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: Colors.redAccent,
                ),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              showDialog(
                context: context,
                builder: (dialogContext) => AlertDialog(
                  title: Text(
                    'delete_data'.tr(dialogContext),
                    style: GoogleFonts.urbanist(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  content: Text(
                    'confirm_delete_data'.tr(dialogContext),
                    style: GoogleFonts.urbanist(
                      color: Colors.black,
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      child: Text(
                        'cancel'.tr(dialogContext),
                        style: GoogleFonts.urbanist(color: Colors.black, fontWeight: FontWeight.w600),
                      ),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.pop(dialogContext);
                        final repo = UserRepository();
                        await repo.saveProfile('', '', null);
                        await repo.saveNotifSettings(
                          match: true,
                          news: true,
                          video: true,
                          streaming: true,
                          promotions: true,
                          updates: true,
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('delete_data_success'.tr(context)),
                            ),
                          );
                        }
                      },
                      child: Text('delete'.tr(dialogContext), style: GoogleFonts.urbanist(color: Colors.red, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
