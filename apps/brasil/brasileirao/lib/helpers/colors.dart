part of 'helpers.dart';

abstract class AppColor {
  // --- Tema Padrão (Fundo Brasileirão #1D965C e Cards em tom mais escuro #135B37) ---
  static const Color primary = Color(0xFFFFFFFF);          // Branco para ícones/destaques
  static const Color accent = Color(0xFF10B981);           // Verde vibrante de destaque
  static const Color background = Color(0xFF1D965C);       // Fundo #1D965C
  static const Color card = Color(0xFF135B37);             // Cards em tom mais escuro #135B37
  static const Color text = Color(0xFFFFFFFF);             // Fonte Branca para Contraste
  static const Color darkGreen = Color(0xFF1D965C);        // Destaque verde
  static const Color drawerBackground = Color(0xFF135B37); // Fundo Drawer
  static const Color drawerHeader = Color(0xFF0F4A2C);     // Header Drawer
  static const Color appBarBackground = Color(0xFF135B37); // Fundo AppBar

  // --- Tema Escuro (Monochrome / Slate Night) ---
  static const Color darkPrimary = Color(0xFF38BDF8);      // Azul Destaque
  static const Color darkBackground = Color(0xFF0F172A);   // Slate 900
  static const Color darkCard = Color(0xFF1E293B);         // Slate 800
  static const Color darkText = Color(0xFFF8FAFC);         // Branco Slate
  static const Color darkAccent = Color(0xFF334155);       // Slate 700
  static const Color darkDrawerBackground = Color(0xFF0F172A); 
  static const Color darkDrawerHeader = Color(0xFF1E293B); 
  static const Color darkAppBarBackground = Color(0xFF0F172A);

  // --- Tema Branco (Clean Light) ---
  static const Color lightPrimary = Color(0xFF1D965C);     // Verde Brasileirão Destaque
  static const Color lightBackground = Color(0xFFF8FAFC);  // Branco Slate 50
  static const Color lightCard = Color(0xFFFFFFFF);        // Branco Puro
  static const Color lightText = Color(0xFF0F172A);        // Texto Escuro Slate 900
  static const Color lightAccent = Color(0xFFE2E8F0);      // Cinza Claro
  static const Color lightDrawerBackground = Color(0xFFFFFFFF); 
  static const Color lightDrawerHeader = Color(0xFFF1F5F9); 
  static const Color lightAppBarBackground = Color(0xFFFFFFFF);

  // --- Cores Funcionais ---
  static const Color logout = Color(0xFFF75555);
  static const Color info = Color(0xff34383F); 
  static const Color hint = Color(0xffBDBDBD);
  static const Color dialogBack = Color(0x99000000);
}
