part of '../screens.dart';

class SecurityScreen extends StatelessWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Security'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        children: [
          CardTileSwitch(
            label: 'Remember me',
            value: true,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Biometric ID',
            value: true,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Face ID',
            value: true,
            onChange: (value) {},
          ),
          ListTile(
            title: Text(
              'Two-Factor Authentication',
              style: context.textTheme.bodyMedium,
            ),
            contentPadding: EdgeInsets.zero,
            trailing: const Icon(Icons.arrow_forward_ios, size: 18),
          ),
          const Gap(20),
          CardLogin(
            label: 'Change Password',
            onTap: () {},
            color: AppColor.info,
          ),
        ],
      ),
    );
  }
}
