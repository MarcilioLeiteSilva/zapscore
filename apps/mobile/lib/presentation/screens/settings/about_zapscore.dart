part of '../screens.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About ${AppText.appName}'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 15),
        children: [
          SvgPicture.asset(
            Assets.iconSvg,
            width: 140,
            height: 140,
          ),
          const Gap(10),
          Center(
            child: Text(
              '${AppText.appName} v1.0.0',
              style: context.textTheme.headlineSmall,
            ),
          ),
          const Gap(20),
          const Divider(endIndent: 15, indent: 15),
          ListTile(
            title: Text(
              'Mouad Zizi',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Fess',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Developer',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Partner',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Privacy Policy',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Accessibility',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Feedback',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Rate us',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Visit Our Website',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          ListTile(
            title: Text(
              'Follow us on Social Media',
              style: context.textTheme.bodySmall,
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
        ],
      ),
    );
  }
}
