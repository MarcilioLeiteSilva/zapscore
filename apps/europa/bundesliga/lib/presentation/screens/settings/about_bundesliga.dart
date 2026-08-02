part of '../screens.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'about'.tr(context),
          style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        children: [
          Center(
            child: Image.asset(
              Assets.transparentIcon,
              width: 110,
              height: 110,
            ),
          ),
          const Gap(12),
          Center(
            child: Text(
              '${AppText.appName} v1.0.0',
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.titleMedium!.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const Gap(16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'about_desc'.tr(context),
              textAlign: TextAlign.center,
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium!.copyWith(
                  color: Colors.white70,
                  height: 1.4,
                ),
              ),
            ),
          ),
          const Gap(24),
          const Divider(),
          const Gap(10),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined, color: Colors.red),
            title: Text(
              'privacy_policy'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenPrivacyPolicy);
            },
          ),
          ListTile(
            leading: const Icon(Icons.security_outlined, color: Colors.red),
            title: Text(
              'lgpd'.tr(context),
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenLgpd);
            },
          ),
        ],
      ),
    );
  }
}
