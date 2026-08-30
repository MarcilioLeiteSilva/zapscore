part of 'helpers.dart';

abstract class AppColor {
  // --- Tema Padrão (Fundo #008ADB, Topbar/Drawer #087CC1) ---
  static const Color primary = Color(0xFFE30613);          
  static const Color accent = Color(0xFFE30613);           
  static const Color background = Color(0xFF005C8A);       // Fundo #005C8A
  static const Color card = Color(0xFF073146);             // Cards #073146
  static const Color text = Color(0xFFFFFFFF);             // Fonte Branca para Contraste
  static const Color darkGreen = Color(0xFF087CC1);        // Ícones nos Cards #087CC1
  static const Color drawerBackground = Color(0xFF087CC1); // Fundo #087CC1 Drawer
  static const Color drawerHeader = Color(0xFF073146);     // Cards Header #073146
  static const Color appBarBackground = Color(0xFF087CC1);  // Fundo #087CC1 AppBar

  // --- Tema Escuro (Monochrome / Slate Night) ---
  static const Color darkPrimary = Color(0xFFFF4B5C);      // Vermelho Acento Ligue 1
  static const Color darkBackground = Color(0xFF0F172A);   // Slate 900
  static const Color darkCard = Color(0xFF1E293B);         // Slate 800
  static const Color darkText = Color(0xFFF8FAFC);         // Branco Slate
  static const Color darkAccent = Color(0xFF334155);       // Slate 700
  static const Color darkDrawerBackground = Color(0xFF0F172A); 
  static const Color darkDrawerHeader = Color(0xFF1E293B); 
  static const Color darkAppBarBackground = Color(0xFF0F172A);

  // --- Tema Branco (Clean Light) ---
  static const Color lightPrimary = Color(0xFFE30613);     // Vermelho Ligue 1 Destaque
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
