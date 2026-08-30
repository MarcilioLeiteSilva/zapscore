part of '../screens.dart';

class GeneralScreen extends StatelessWidget {
  const GeneralScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('general'.tr(context)),
        centerTitle: true,
      ),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.language, color: Colors.blue),
            title: Text(
              'languages'.tr(context),
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenLanguages);
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.help_outline, color: Colors.orange),
            title: Text(
              'help'.tr(context),
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenHelpCenter);
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: Icon(Icons.shield_outlined, color: Theme.of(context).primaryColor),
            title: const Text('Política de Privacidade'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenPrivacyPolicy);
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.info_outline, color: Colors.deepPurpleAccent),
            title: Text(
              'about'.tr(context),
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              context.pushNamed(screenAbout);
            },
          ),
        ],
      ),
    );
  }
}
