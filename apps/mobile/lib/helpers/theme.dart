part of 'helpers.dart';

class AppCustomColors extends ThemeExtension<AppCustomColors> {
  final Color? drawerBackground;
  final Color? drawerHeader;
  final Color? darkGreen;
  final Color? info;
  final Color? hint;
  final Color? logout;

  AppCustomColors({
    required this.drawerBackground,
    required this.drawerHeader,
    required this.darkGreen,
    required this.info,
    required this.hint,
    required this.logout,
  });

  @override
  AppCustomColors copyWith({
    Color? drawerBackground,
    Color? drawerHeader,
    Color? darkGreen,
    Color? info,
    Color? hint,
    Color? logout,
  }) {
    return AppCustomColors(
      drawerBackground: drawerBackground ?? this.drawerBackground,
      drawerHeader: drawerHeader ?? this.drawerHeader,
      darkGreen: darkGreen ?? this.darkGreen,
      info: info ?? this.info,
      hint: hint ?? this.hint,
      logout: logout ?? this.logout,
    );
  }

  @override
  AppCustomColors lerp(ThemeExtension<AppCustomColors>? other, double t) {
    if (other is! AppCustomColors) return this;
    return AppCustomColors(
      drawerBackground: Color.lerp(drawerBackground, other.drawerBackground, t),
      drawerHeader: Color.lerp(drawerHeader, other.drawerHeader, t),
      darkGreen: Color.lerp(darkGreen, other.darkGreen, t),
      info: Color.lerp(info, other.info, t),
      hint: Color.lerp(hint, other.hint, t),
      logout: Color.lerp(logout, other.logout, t),
    );
  }
}

extension AppThemeExtension on BuildContext {
  AppCustomColors get appColors => Theme.of(this).extension<AppCustomColors>()!;
}

abstract class AppTheme {
  static ThemeData getTheme(BuildContext context, String themeType) {
    final textTheme = Theme.of(context).textTheme;
    final isWhite = themeType == 'white';
    final isDefault = themeType == 'default';

    Color primaryColor;
    Color bgColor;
    Color cardColor;
    Color textColor;
    Color appBarBg;
    
    // Custom colors for extension
    Color drawerBg;
    Color drawerHead;
    Color darkG;
    Color infoColor;
    Color hintColor;

    switch (themeType) {
      case 'dark':
        primaryColor = AppColor.darkPrimary;
        bgColor = AppColor.darkBackground;
        cardColor = AppColor.darkCard;
        textColor = AppColor.darkText;
        appBarBg = AppColor.darkAppBarBackground;
        drawerBg = AppColor.darkDrawerBackground;
        drawerHead = AppColor.darkDrawerHeader;
        darkG = AppColor.darkCard; // No dark mode, we use card color
        infoColor = AppColor.darkAccent;
        hintColor = AppColor.hint.withOpacity(0.5);
        break;
      case 'white':
        primaryColor = AppColor.lightPrimary;
        bgColor = AppColor.lightBackground;
        cardColor = AppColor.lightCard;
        textColor = AppColor.lightText;
        appBarBg = AppColor.lightAppBarBackground;
        drawerBg = AppColor.lightDrawerBackground;
        drawerHead = AppColor.lightDrawerHeader;
        darkG = AppColor.lightCard; // No white mode, we use card color
        infoColor = AppColor.lightAccent;
        hintColor = AppColor.hint;
        break;
      default: // 'default'
        primaryColor = AppColor.primary;
        bgColor = AppColor.background;
        cardColor = AppColor.card;
        textColor = AppColor.text;
        appBarBg = AppColor.appBarBackground;
        drawerBg = AppColor.drawerBackground;
        drawerHead = AppColor.drawerHeader;
        darkG = AppColor.darkGreen;
        infoColor = AppColor.info;
        hintColor = AppColor.hint;
    }

    return ThemeData(
      useMaterial3: true,
      brightness: isWhite ? Brightness.light : Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: bgColor,
      extensions: [
        AppCustomColors(
          drawerBackground: drawerBg,
          drawerHeader: drawerHead,
          darkGreen: darkG,
          info: infoColor,
          hint: hintColor,
          logout: AppColor.logout,
        ),
      ],
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        onPrimary: isWhite ? Colors.white : Colors.black,
        secondary: isDefault ? AppColor.accent : primaryColor.withOpacity(0.8),
        onSecondary: Colors.white,
        surface: cardColor,
        onSurface: textColor,
        background: bgColor,
        onBackground: textColor,
        brightness: isWhite ? Brightness.light : Brightness.dark,
      ),
      dividerTheme: DividerThemeData(color: isWhite ? Colors.black12 : Colors.white10),
      appBarTheme: AppBarTheme(
        backgroundColor: appBarBg,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.urbanist(
          textStyle: TextStyle(
            color: textColor,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        iconTheme: IconThemeData(color: textColor),
      ),
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
      textTheme: GoogleFonts.urbanistTextTheme(textTheme).apply(
        bodyColor: textColor,
        displayColor: textColor,
      ).copyWith(
        bodyLarge: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 24),
        bodyMedium: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 20),
        bodySmall: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 18),
        labelLarge: TextStyle(color: textColor.withOpacity(0.8), fontWeight: FontWeight.normal, fontSize: 20),
        labelMedium: TextStyle(color: textColor.withOpacity(0.8), fontWeight: FontWeight.normal, fontSize: 18),
        labelSmall: TextStyle(color: textColor.withOpacity(0.8), fontWeight: FontWeight.normal, fontSize: 15),
      ),
      iconTheme: IconThemeData(color: textColor),
    );
  }
}
