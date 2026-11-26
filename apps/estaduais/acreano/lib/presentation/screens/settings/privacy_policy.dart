part of '../screens.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'privacy_policy'.tr(context),
          style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF454444),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Campeonato Acreano',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.titleMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColor.accent,
                  ),
                ),
              ),
              const Gap(4),
              Text(
                'POLÍTICA DE PRIVACIDADE',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.labelMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              const Gap(12),
              const Divider(),
              const Gap(12),
              Text(
                '''Data de vigência e última atualização: 25 de novembro de 2026
Aplicativo: Campeonato Acreano (com.zapscore.estadualacreano)
Desenvolvedor: Prolaser Dev (Ecossistema ZapScore)
E-mail de Contato e Suporte: contato@prolaserdev.com

1. INTRODUÇÃO E ESCOPO
Esta Política de Privacidade aplica-se especificamente ao aplicativo móvel Campeonato Acreano (Acreano 2027: Tabela e Jogos), registrado sob o pacote com.zapscore.estadualacreano na Google Play Store e desenvolvido por Prolaser Dev. Este documento descreve de forma transparente e abrangente quais dados do usuário e do dispositivo são acessados, coletados, utilizados e compartilhados pelo aplicativo, bem como os direitos e controles à disposição do usuário.

2. COLETA E USO DE INFORMAÇÕES
O aplicativo Campeonato Acreano foi projetado para fornecer placares ao vivo, tabela de classificação, escalações, estatísticas, notícias e vídeos do futebol acreano sem exigir cadastro obrigatório, criação de conta ou login.

2.1. Dados que NÃO Coletamos
O aplicativo não solicita, não acessa e não coleta dados pessoais sensíveis do dispositivo, tais como: câmera, microfone, lista de contatos, galeria de fotos/arquivos pessoais, localização geográfica precisa (GPS), registros de chamadas, SMS, Bluetooth ou NFC.

2.2. Dados Coletados Automaticamente do Dispositivo
- Token de Notificação Push (Firebase Cloud Messaging - FCM Token): Identificador técnico anônimo gerado pelo dispositivo para permitir o envio de alertas de início de jogos, gols, placares e notícias dos clubes selecionados pelo usuário.
- Identificador de Publicidade do Android (Google Advertising ID - AAID): Utilizado pelo SDK do Google AdMob para exibição de banners e anúncios, limitação de frequência publicitária, prevenção contra fraudes e medição de desempenho de anúncios, respeitando o consentimento concedido pelo usuário.
- Dados Técnicos e de Diagnóstico: Modelo do aparelho, versão do sistema operacional Android, idioma configurado, endereço IP (de forma transitória nas requisições de rede HTTPS), registros de falhas (crash logs) e métricas de desempenho.
- Preferências Locais do Usuário: Times marcados como favoritos, preferências de alertas e tema visual salvos localmente no aparelho (SharedPreferences).

2.3. Interações Voluntárias no Aplicativo
- Enquetes e Palpites de Partidas: Quando o usuário vota voluntariamente em uma enquete ("Vote no Vencedor"), apenas o cômputo anônimo do voto vinculado a um identificador técnico local é enviado ao servidor, sem qualquer identificação pessoal.

3. PERMISSÕES DO SISTEMA UTILIZADAS
- android.permission.INTERNET: Necessária para buscar a tabela atualizada, placares ao vivo, estatísticas, escalações, notícias e vídeos.
- android.permission.ACCESS_NETWORK_STATE: Necessária para verificar a conexão ativa e acionar o modo offline quando necessário.
- android.permission.POST_NOTIFICATIONS: Permissão opcional solicitada ao usuário exclusivamente para exibir alertas de gols e partidas. Pode ser revogada a qualquer momento nas configurações do aparelho.

4. FINALIDADE DO TRATAMENTO DOS DADOS
- Exibir resultados de jogos, classificação, artilharia, escalações e notícias do Campeonato Acreano em tempo real;
- Enviar notificações push de gols e eventos das partidas para os dispositivos que autorizaram o recebimento;
- Exibir anúncios através do Google AdMob e campanhas informativas internas (House Ads) para viabilizar o acesso gratuito à informação;
- Diagnosticar falhas, monitorar estabilidade e garantir compatibilidade com versões do Android.

5. COMPARTILHAMENTO DE DADOS E SERVIÇOS DE TERCEIROS
A Prolaser Dev não comercializa dados dos usuários. O aplicativo utiliza SDKs oficiais:
- Google Play Services: https://policies.google.com/privacy
- Google AdMob & UMP: https://policies.google.com/technologies/ads
- Firebase Cloud Messaging: https://firebase.google.com/support/privacy

6. RETENÇÃO E EXCLUSÃO DE DADOS (LGPD)
O usuário pode excluir seus dados locais a qualquer momento limpando o cache e armazenamento do aplicativo ou desinstalando o app. Para solicitar exclusão formal de registros técnicos ou esclarecer dúvidas sobre a LGPD, envie mensagem para contato@prolaserdev.com com o assunto "Exclusão de Dados - Acreano".

7. SEGURANÇA
Todas as transmissões de dados entre o aplicativo e os servidores utilizam criptografia HTTPS/TLS.

8. CONTATO
Prolaser Dev (Ecossistema ZapScore)
E-mail: contato@prolaserdev.com
Identificador do Pacote: com.zapscore.estadualacreano''',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.bodySmall!.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.9),
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
