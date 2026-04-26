part of '../screens.dart';

class GeneralScreen extends StatelessWidget {
  const GeneralScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('General'),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text(
              'Automatic refresh',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Clear Cache',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Vibration',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Privacy and Cookies',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'News Publishers',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Video Publishers',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Consent Preferences',
              style: context.textTheme.bodyMedium,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
        ],
      ),
    );
  }
}
