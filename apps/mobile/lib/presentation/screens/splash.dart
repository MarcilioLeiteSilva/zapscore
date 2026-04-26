part of 'screens.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    Future.delayed(const Duration(seconds: 3)).then((value) {
      context.pushReplacementNamed(screenHome);
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    Assets.appIcon,
                    width: 120,
                  ),
                  const Gap(15),
                  Text(AppText.appName,
                      style: context.textTheme.headlineLarge!.copyWith(
                        fontWeight: FontWeight.bold,
                      )),
                ],
              ),
            ),
            LoadingAnimationWidget.hexagonDots(
              color: AppColor.primary,
              size: 30,
            ),
          ],
        ),
      ),
    );
  }
}
