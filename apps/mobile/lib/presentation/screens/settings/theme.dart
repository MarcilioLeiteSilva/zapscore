part of '../screens.dart';

class ThemeScreen extends StatelessWidget {
  const ThemeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themes = [
      {'id': 'default', 'name': 'Padrão (Brasil)', 'desc': 'Verde Oliva, Amarelo e Azul'},
      {'id': 'dark', 'name': 'Escuro', 'desc': 'Alta visibilidade noturna'},
      {'id': 'white', 'name': 'Branco', 'desc': 'Claro e limpo'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('theme'.tr(context)),
      ),
      body: ListView.builder(
        itemCount: themes.length,
        itemBuilder: (context, index) {
          final theme = themes[index];
          final isSelected = context.watch<SettingCubit>().state.theme == theme['id'];

          return ListTile(
            leading: Icon(
              theme['id'] == 'dark' ? Icons.dark_mode : 
              theme['id'] == 'white' ? Icons.light_mode : Icons.palette,
              color: isSelected ? (
                theme['id'] == 'dark' ? AppColor.darkPrimary :
                theme['id'] == 'white' ? AppColor.lightPrimary : AppColor.primary
              ) : null,
            ),
            title: Text(
              theme['name']!,
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(theme['desc']!),
            trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.green) : null,
            onTap: () {
              context.read<SettingCubit>().updateTheme(theme['id']!);
            },
          );
        },
      ),
    );
  }
}
