part of 'helpers.dart';

abstract class AppColor {
  // --- Tema Padrão (Fundo Mineiro #991B1B e Cards em tom contrastante #7F1D1D) ---
  static const Color primary = Color(0xFFFFFFFF);          // Branco para ícones/destaques
  static const Color accent = Color(0xFFFBBF24);           // Amarelo/Dourado harmonioso
  static const Color background = Color(0xFF991B1B);       // Fundo Vermelho Mineiro #991B1B
  static const Color card = Color(0xFF7F1D1D);             // Cards em tom mais escuro #7F1D1D
  static const Color text = Color(0xFFFFFFFF);             // Fonte Branca para Contraste
  static const Color darkGreen = Color(0xFF991B1B);        // Destaque vermelho mineiro
  static const Color drawerBackground = Color(0xFF7F1D1D); // Fundo Drawer
  static const Color drawerHeader = Color(0xFF5C1111);     // Header Drawer
  static const Color appBarBackground = Color(0xFF7F1D1D); // Fundo AppBar

  // --- Tema Escuro (Monochrome / Slate Night) ---
  static const Color darkPrimary = Color(0xFFF87171);      // Vermelho Destaque Claro
  static const Color darkBackground = Color(0xFF0F172A);   // Slate 900
  static const Color darkCard = Color(0xFF1E293B);         // Slate 800
  static const Color darkText = Color(0xFFF8FAFC);         // Branco Slate
  static const Color darkAccent = Color(0xFF334155);       // Slate 700
  static const Color darkDrawerBackground = Color(0xFF0F172A); 
  static const Color darkDrawerHeader = Color(0xFF1E293B); 
  static const Color darkAppBarBackground = Color(0xFF0F172A);

  // --- Tema Branco (Clean Light) ---
  static const Color lightPrimary = Color(0xFF991B1B);     // Vermelho Destaque
  static const Color lightBackground = Color(0xFFF8FAFC);  // Branco Slate 50
  static const Color lightCard = Color(0xFFFFFFFF);        // Branco Puro
  static const Color lightText = Color(0xFF0F172A);        // Texto Escuro Slate 900
  static const Color lightAccent = Color(0xFFE2E8F0);      // Cinza Claro
  static const Color lightDrawerBackground = Color(0xFFFFFFFF); 
  static const Color lightDrawerHeader = Color(0xFFF1F5F9); 
  static const Color lightAppBarBackground = Color(0xFFFFFFFF);

  // --- Cores Funcionais ---
  static const Color logout = Color(0xFFFBBF24);
  static const Color info = Color(0xff34383F); 
  static const Color hint = Color(0xffBDBDBD);
  static const Color dialogBack = Color(0x99000000);
}
