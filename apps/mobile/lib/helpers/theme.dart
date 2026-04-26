part of 'helpers.dart';

abstract class AppTheme {
  static ThemeData darTheme(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ThemeData.dark(
      useMaterial3: true,
    ).copyWith(
      brightness: Brightness.dark,
      colorScheme: _getColorScheme(AppColor.primary),
      scaffoldBackgroundColor: AppColor.background,
      dividerTheme: const DividerThemeData(color: AppColor.info),
      searchBarTheme: SearchBarThemeData(
        backgroundColor: const MaterialStatePropertyAll(AppColor.card),
        surfaceTintColor: const MaterialStatePropertyAll(AppColor.card),
        textStyle: MaterialStatePropertyAll(
          GoogleFonts.urbanist(
            textStyle: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ),
        hintStyle: MaterialStatePropertyAll(
          GoogleFonts.urbanist(
            textStyle: const TextStyle(
              color: AppColor.hint,
              fontWeight: FontWeight.normal,
              fontSize: 15,
            ),
          ),
        ),
        shape: MaterialStatePropertyAll(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
        ),
      ),
      appBarTheme: AppBarTheme(
        surfaceTintColor: AppColor.background,
        backgroundColor: AppColor.background,
        titleTextStyle: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        hintStyle: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: AppColor.hint,
            fontWeight: FontWeight.normal,
            fontSize: 15,
          ),
        ),
        border: UnderlineInputBorder(
          borderRadius: BorderRadius.circular(5),
          borderSide: const BorderSide(
            color: AppColor.primary,
          ),
        ),
      ),
      textTheme: GoogleFonts.urbanistTextTheme(textTheme).copyWith(
        labelLarge: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.normal,
            fontSize: 20,
          ),
        ),
        labelMedium: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.normal,
            fontSize: 18,
          ),
        ),
        labelSmall: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.normal,
            fontSize: 15,
          ),
        ),
        bodyLarge: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 24,
          ),
        ),
        bodyMedium: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
        bodySmall: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        headlineLarge: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 28,
          ),
        ),
        headlineMedium: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 26,
          ),
        ),
        headlineSmall: GoogleFonts.urbanist(
          textStyle: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 24,
          ),
        ),
      ),
    );
  }

  static ColorScheme _getColorScheme(Color primaryColor,
      {Color? secondaryColor, Color? backgroundColor}) {
    final brightness = ThemeData.estimateBrightnessForColor(primaryColor);
    final isDark = brightness == Brightness.dark;

    // Determine secondary color if provided, else generate it based on primary color
    final calculatedSecondaryColor = secondaryColor ??
        (isDark
            ? primaryColor.withOpacity(0.4)
            : primaryColor.withOpacity(0.8));

    // Determine background color if provided, else generate it based on primary color
    final calculatedBackgroundColor =
        backgroundColor ?? (isDark ? Colors.grey[900]! : Colors.white);

    return ColorScheme(
      primary: primaryColor,
      secondary: calculatedSecondaryColor,
      surface: calculatedBackgroundColor,
      background: calculatedBackgroundColor,
      error: Colors.red,
      onPrimary: isDark ? Colors.white : Colors.black,
      onSecondary: isDark ? Colors.white : Colors.black,
      onSurface: isDark ? Colors.white : Colors.black,
      onBackground: isDark ? Colors.white : Colors.black,
      onError: isDark ? Colors.white : Colors.black,
      brightness: brightness,
    );
  }
}
