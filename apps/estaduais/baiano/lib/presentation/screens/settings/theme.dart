part of '../screens.dart';

class ThemeScreen extends StatelessWidget {
  const ThemeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themes = [
      {
        'id': 'default',
        'name': 'Padrão',
        'desc': 'Verde Campeonato Baiano oficial (#1D965C)',
        'color': const Color(0xFF1D965C),
        'icon': Icons.palette_rounded,
      },
      {
        'id': 'dark',
        'name': 'Escuro',
        'desc': 'Alta visibilidade noturna',
        'color': const Color(0xFF38BDF8),
        'icon': Icons.dark_mode_rounded,
      },
      {
        'id': 'white',
        'name': 'Claro',
        'desc': 'Visual limpo e brilhante',
        'color': const Color(0xFF0F172A),
        'icon': Icons.light_mode_rounded,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('theme'.tr(context)),
        centerTitle: true,
      ),
      body: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        itemCount: themes.length,
        separatorBuilder: (_, __) => const Gap(12),
        itemBuilder: (context, index) {
          final theme = themes[index];
          final String themeId = theme['id'] as String;
          final isSelected = context.watch<SettingCubit>().state.theme == themeId;
          final Color themeColor = theme['color'] as Color;
          final IconData themeIcon = theme['icon'] as IconData;

          return InkWell(
            onTap: () {
              context.read<SettingCubit>().updateTheme(themeId);
            },
            borderRadius: BorderRadius.circular(15),
            child: Ink(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: themeColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      themeIcon,
                      color: themeColor,
                      size: 22,
                    ),
                  ),
                  const Gap(14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          theme['name'] as String,
                          style: context.textTheme.bodyMedium?.copyWith(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const Gap(2),
                        Text(
                          theme['desc'] as String,
                          style: TextStyle(
                            color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(
                      Icons.check_circle_rounded,
                      color: Theme.of(context).primaryColor,
                      size: 24,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
