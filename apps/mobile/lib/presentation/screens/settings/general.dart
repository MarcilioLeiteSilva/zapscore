part of '../screens.dart';

class GeneralScreen extends StatelessWidget {
  const GeneralScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('general'.tr(context)),
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
          ListTile(
            leading: const Icon(Icons.share, color: Colors.green),
            title: Text(
              'share'.tr(context),
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
            onTap: () {
              // Share functionality
            },
          ),
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
        ],
      ),
    );
  }
}
