part of '../screens.dart';

class NewsContentScreen extends StatefulWidget {
  final News news;
  const NewsContentScreen({super.key, required this.news});

  @override
  State<NewsContentScreen> createState() => _NewsContentScreenState();
}

class _NewsContentScreenState extends State<NewsContentScreen> {
  double _progress = 0;

  final String _cleanupScript = """
    (function() {
      const hideElements = () => {
        const selectors = [
          'header', 'footer', 'nav', '.header', '.footer', '.nav', '.navbar',
          '.site-header', '.site-footer', '.header-container', '.footer-container',
          '#header', '#footer', '#site-header', '#site-footer', '.top-bar', '.topbar',
          '.menu', '.sidebar', 'aside', '.cookie-banner', '#cookie-consent',
          '.privacy-popup', '.consent-banner', '.newsletter-box', '.subscription-prompt',
          '.related-posts', '.comments', '#comments', '.social-share', '.share-bar',
          '.ad-container', '.advertisement', '.ads', '.adsbygoogle', '.banner'
        ];
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('height', '0px', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
          });
        });
        document.body.style.setProperty('padding-top', '0px', 'important');
        document.body.style.setProperty('margin-top', '0px', 'important');
      };
      hideElements();
      setTimeout(hideElements, 500);
      setTimeout(hideElements, 1500);
      setTimeout(hideElements, 3000);
    })();
  """;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.news.source?.toUpperCase() ?? 'NOTÍCIA', style: const TextStyle(fontSize: 16)),
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
                ContentBlocker(
                  trigger: ContentBlockerTrigger(urlFilter: ".*googleadservices.*|.*doubleclick.*|.*googlesyndication.*|.*adservice.*|.*analytics.*|.*adsafeprotected.*|.*outbrain.*|.*taboola.*"),
                  action: ContentBlockerAction(type: ContentBlockerActionType.BLOCK),
                ),
                ContentBlocker(
                  trigger: ContentBlockerTrigger(urlFilter: ".*"),
                  action: ContentBlockerAction(
                    type: ContentBlockerActionType.CSS_DISPLAY_NONE,
                    selector: "header, footer, nav, .header, .footer, .nav, .site-header, .site-footer, .advertisement, .ads, .adsbygoogle, .banner, .newsletter, .social-share, .comments, #ads, #banner, .cookie-banner",
                  ),
                ),
              ],
            ),
            onLoadStart: (controller, url) {
              controller.evaluateJavascript(source: _cleanupScript);
            },
            onProgressChanged: (controller, progress) {
              setState(() {
                _progress = progress / 100;
              });
              if (progress > 40) {
                controller.evaluateJavascript(source: _cleanupScript);
              }
            },
            onLoadStop: (controller, url) async {
              await controller.evaluateJavascript(source: _cleanupScript);
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
