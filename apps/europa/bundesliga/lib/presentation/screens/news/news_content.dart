part of '../screens.dart';

class NewsContentScreen extends StatefulWidget {
  final News news;
  const NewsContentScreen({super.key, required this.news});

  @override
  State<NewsContentScreen> createState() => _NewsContentScreenState();
}

class _NewsContentScreenState extends State<NewsContentScreen> {
  double _progress = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.news.source?.toUpperCase() ?? 'NEWS', style: const TextStyle(fontSize: 16)),
        actions: [
          IconButton(
            onPressed: () {},
            icon: SvgPicture.asset(Assets.share),
          ),
        ],
      ),
      body: Stack(
        children: [
          InAppWebView(
            initialUrlRequest: URLRequest(url: WebUri(widget.news.externalUrl ?? '')),
            initialSettings: InAppWebViewSettings(
              javaScriptEnabled: true,
              supportZoom: true,
              displayZoomControls: false,
              contentBlockers: [
                // Bloquear domínios de anúncios conhecidos
                ContentBlocker(
                  trigger: ContentBlockerTrigger(urlFilter: ".*googleadservices.*|.*doubleclick.*|.*googlesyndication.*|.*adservice.*|.*analytics.*|.*adsafeprotected.*|.*outbrain.*|.*taboola.*"),
                  action: ContentBlockerAction(type: ContentBlockerActionType.BLOCK),
                ),
                // Esconder elementos de anúncios via CSS
                ContentBlocker(
                  trigger: ContentBlockerTrigger(urlFilter: ".*"),
                  action: ContentBlockerAction(
                    type: ContentBlockerActionType.CSS_DISPLAY_NONE,
                    selector: ".advertisement, .ads, .adsbygoogle, .banner, .newsletter, .social-share, .comments, #ads, #banner",
                  ),
                ),
              ],
            ),
            onWebViewCreated: (controller) {
            },
            onProgressChanged: (controller, progress) {
              setState(() {
                _progress = progress / 100;
              });
            },
            onLoadStop: (controller, url) async {
              // Script para suprimir cabeçalho, rodapé e menus
              await controller.evaluateJavascript(source: """
                (function() {
                  const selectors = [
                    'header', 'footer', '.header', '.footer', 'nav', '.nav', 
                    '.menu', '#header', '#footer', '.advertisement', '.ads',
                    '.sidebar', 'aside', '.newsletter-box', '.related-posts'
                  ];
                  selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => el.style.display = 'none');
                  });
                  // Ajuste de margem para evitar buracos brancos no topo
                  document.body.style.paddingTop = '0';
                  document.body.style.marginTop = '0';
                })();
              """);
            },
          ),
          if (_progress < 1.0)
            LinearProgressIndicator(
              value: _progress,
              color: AppColor.primary,
              backgroundColor: Colors.transparent,
              minHeight: 3,
            ),
        ],
      ),
    );
  }
}
