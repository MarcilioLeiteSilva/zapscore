part of '../screens.dart';

class LanguagesScreen extends StatelessWidget {
  const LanguagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final languages = [
      {'code': 'pt', 'name': 'Português', 'flag': '🇧🇷'},
      {'code': 'en', 'name': 'English', 'flag': '🇺🇸'},
      {'code': 'es', 'name': 'Español', 'flag': '🇪🇸'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('languages'.tr(context)),
      ),
      body: ListView.builder(
        itemCount: languages.length,
        itemBuilder: (context, index) {
          final lang = languages[index];
          final isSelected = context.watch<SettingCubit>().state.language == lang['code'];

          return ListTile(
            leading: Text(lang['flag']!, style: const TextStyle(fontSize: 24)),
            title: Text(
              lang['name']!,
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            trailing: isSelected ? const Icon(Icons.check, color: AppColor.primary) : null,
            onTap: () {
              context.read<SettingCubit>().updateLanguage(lang['code']!);
              // Refresh or show feedback if needed
            },
          );
        },
      ),
    );
  }
}
