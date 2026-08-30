part of 'helpers.dart';

abstract class AppColor {
  // --- Tema Padrão (Inglaterra: Fundo Vermelho #C8102E, Cards Azuis #0C2340, Detalhes Ouro #FFD700, Fontes Brancas) ---
  static const Color primary = Color(0xFFFFD700);          // Amarelo Ouro #FFD700
  static const Color accent = Color(0xFFFFD700);           // Destaques Amarelo Ouro #FFD700
  static const Color background = Color(0xFFC8102E);       // Fundo Vermelho Inglaterra #C8102E
  static const Color card = Color(0xFF0C2340);             // Cards Azuis #0C2340
  static const Color text = Color(0xFFFFFFFF);             // Fontes Brancas #FFFFFF
  static const Color darkGreen = Color(0xFFFFD700);        // Ícones nos Cards #FFD700
  static const Color drawerBackground = Color(0xFF0C2340); // Fundo Drawer Azul #0C2340
  static const Color drawerHeader = Color(0xFF061426);     // Header Drawer Azul Escuro #061426
  static const Color appBarBackground = Color(0xFFA60D25);  // AppBar Vermelho Escuro #A60D25

  // --- Tema Escuro (Monochrome / Slate Night) ---
  static const Color darkPrimary = Color(0xFFFF4B5C);      // Vermelho Acento Premier League
  static const Color darkBackground = Color(0xFF0F172A);   // Slate 900
  static const Color darkCard = Color(0xFF1E293B);         // Slate 800
  static const Color darkText = Color(0xFFF8FAFC);         // Branco Slate
  static const Color darkAccent = Color(0xFF334155);       // Slate 700
  static const Color darkDrawerBackground = Color(0xFF0F172A); 
  static const Color darkDrawerHeader = Color(0xFF1E293B); 
  static const Color darkAppBarBackground = Color(0xFF0F172A);

  // --- Tema Branco (Clean Light) ---
  static const Color lightPrimary = Color(0xFFE30613);     // Vermelho Premier League Destaque
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
