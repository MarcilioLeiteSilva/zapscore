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
                  'Acompanhe todos os jogos, gols e notícias da Bundesliga em tempo real no ZapScore!\nhttps://play.google.com/store/apps/details?id=com.zapscore.bundesliga',
                );
              } catch (e) {
                final Uri url = Uri.parse('https://play.google.com/store/apps/details?id=com.zapscore.bundesliga');
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
              final Uri url = Uri.parse('https://play.google.com/store/apps/details?id=com.zapscore.bundesliga');
              if (await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            },
          ),
        ],
      ),
    );
  }
}
