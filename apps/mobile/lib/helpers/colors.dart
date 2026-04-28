part of 'helpers.dart';

abstract class AppColor {
  // --- Tema Padrão (Brasil Palette) ---
  static const Color primary = Color(0xFFFFEF00);   // Amarelo Canário
  static const Color accent = Color(0xFF0047AB);    // Azul Cobalto
  static const Color background = Color(0xFF556B2F); // Verde Oliva
  static const Color card = Color(0xFF455A23);       // Verde Oliva mais escuro
  static const Color text = Color(0xFFFFFFFF);
  static const Color darkGreen = Color(0xFF2D3B1C); 
  static const Color drawerBackground = Color(0xE62D3B1C); 
  static const Color drawerHeader = Color(0xFF6B8E23); 
  static const Color appBarBackground = Color(0xFF6B8E23);

  // --- Tema Escuro (Monochrome Dark) ---
  static const Color darkPrimary = Color(0xFFFFFFFF);   // Branco para acentos
  static const Color darkBackground = Color(0xFF000000); // Preto
  static const Color darkCard = Color(0xFF1A1A1A);       // Cinza Escuro
  static const Color darkText = Color(0xFFFFFFFF);       // Branco
  static const Color darkAccent = Color(0xFF333333);     // Cinza
  static const Color darkDrawerBackground = Color(0xFF121212); 
  static const Color darkDrawerHeader = Color(0xFF1A1A1A); 
  static const Color darkAppBarBackground = Color(0xFF000000);

  // --- Tema Branco (Monochrome Light) ---
  static const Color lightPrimary = Color(0xFF000000);   // Preto para acentos
  static const Color lightBackground = Color(0xFFFFFFFF); // Branco
  static const Color lightCard = Color(0xFFF5F5F5);       // Cinza Muito Claro
  static const Color lightText = Color(0xFF000000);       // Preto
  static const Color lightAccent = Color(0xFFE0E0E0);     // Cinza Claro
  static const Color lightDrawerBackground = Color(0xFFFFFFFF); 
  static const Color lightDrawerHeader = Color(0xFFF5F5F5); 
  static const Color lightAppBarBackground = Color(0xFFFFFFFF);

  // --- Cores Funcionais ---
  static const Color logout = Color(0xFFF75555);
  static const Color info = Color(0xff34383F); 
  static const Color hint = Color(0xffBDBDBD);
  static const Color dialogBack = Color(0x99000000);
}
