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
                'Campeonato Paranaense',
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
                '''Data de vigência e última atualização: 23 de novembro de 2026
Aplicativo: Campeonato Paranaense (com.zapscore.estadualparanaense)
Desenvolvedor: Prolaser Dev (Ecossistema ZapScore)
E-mail de Contato e Suporte: contato@prolaserdev.com

1. INTRODUÇÃO E ESCOPO
Esta Política de Privacidade aplica-se especificamente ao aplicativo móvel Campeonato Paranaense (Série A 1ª Divisão e Série B), registrado sob o pacote com.zapscore.estadualparanaense na Google Play Store e desenvolvido por Prolaser Dev. Este documento descreve de forma transparente e abrangente quais dados do usuário e do dispositivo são acessados, coletados, utilizados e compartilhados pelo aplicativo, bem como os direitos e controles à disposição do usuário.

2. COLETA E USO DE INFORMAÇÕES
O aplicativo Campeonato Paranaense foi projetado para fornecer placares ao vivo, tabela de classificação, escalações, estatísticas, notícias e vídeos do futebol paranaense sem exigir cadastro obrigatório, criação de conta ou login.

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
- Exibir resultados de jogos, classificação, artilharia, escalações e notícias do Campeonato Paranaense em tempo real;
- Enviar notificações push de gols e eventos das partidas para os dispositivos que autorizaram o recebimento;
- Exibir anúncios através do Google AdMob e campanhas informativas internas (House Ads) para manter o aplicativo gratuito;
- Diagnosticar erros técnicos, corrigir travamentos e otimizar a estabilidade do aplicativo.

5. COMPARTILHAMENTO DE DADOS E PROVEDORES TERCEIROS (SDKs)
A Prolaser Dev não vende, não aluga e não comercializa dados pessoais de seus usuários. O aplicativo integra bibliotecas (SDKs) oficiais do Google que processam identificadores técnicos conforme suas próprias políticas:
- Google Play Services (https://policies.google.com/privacy)
- Google AdMob & User Messaging Platform - UMP (https://policies.google.com/technologies/ads)
- Google Firebase Cloud Messaging (https://firebase.google.com/support/privacy)

6. PUBLICIDADE E CONTROLE DE CONSENTIMENTO (LGPD / GDPR)
O aplicativo utiliza o fluxo oficial de consentimento do Google (User Messaging Platform - UMP). O usuário pode gerenciar ou revogar a qualquer momento suas preferências de privacidade e personalização de anúncios diretamente no menu Configurações / Privacidade do aplicativo ou nas configurações do sistema Android (Configurações > Google > Anúncios).

7. SEGURANÇA E CRIPTOGRAFIA DE DADOS
Todos os dados transmitidos entre o aplicativo Campeonato Paranaense e nossos servidores ou APIs parceiras são protegidos com criptografia em trânsito via protocolo seguro HTTPS/TLS (Transport Layer Security).

8. RETENÇÃO, GERENCIAMENTO E EXCLUSÃO DE DADOS
Como o aplicativo não exige criação de conta com nome, senha ou e-mail, não mantemos bancos de dados de cadastros pessoais identificáveis.
- Exclusão de Preferências Locais: O usuário pode apagar todas as suas preferências locais limpando os dados do aplicativo nas configurações do Android ou desinstalando o app.
- Cancelamento de Notificações (Token FCM): Ao desativar as notificações ou desinstalar o app, o token de push é invalidado automaticamente.
- Solicitação de Exclusão (LGPD - Lei nº 13.709/2018): Solicitações podem ser enviadas para contato@prolaserdev.com e são atendidas em até 15 dias.

9. PRIVACIDADE DE CRIANÇAS
O aplicativo tem caráter informativo e esportivo, não sendo direcionado a crianças menores de 13 anos e não coletando intencionalmente dados pessoais de crianças.

10. CONTATO E SUPORTE
Desenvolvedor / Responsável: Prolaser Dev
Aplicativo: Campeonato Paranaense (com.zapscore.estadualparanaense)
E-mail: contato@prolaserdev.com
Website: https://alogerais.com.br''',
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.bodySmall!.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.85),
                    fontSize: 12,
                    height: 1.55,
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
