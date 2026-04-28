part of '../screens.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              width: context.width,
              height: context.height * .5,
              child: Stack(
                children: [
                  Positioned(
                    top: 20,
                    right: -50,
                    child: Image(
                      image: const AssetImage(Assets.intro),
                      width: context.width,
                      fit: BoxFit.contain,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 0),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Welcome 👋",
                      style: context.textTheme.headlineLarge!.copyWith(
                        color: Theme.of(context).primaryColor,
                        fontSize: 40,
                      ),
                    ),
                    const Gap(10),
                    Text(
                      "Don't miss a goal! Get live match notifications\n and match results from your favorite teams\nand world's most prestigious competitions!",
                      style: context.textTheme.labelMedium,
                    ),
                    const Gap(40),
                    CardLogin(
                      label: 'Get Started',
                      onTap: () {
                        context.pushNamed(screenRegister);
                      },
                    ),
                    const Gap(20),
                    CardLogin(
                      label: 'I Already Have on Account!',
                      color: context.appColors.info,
                      onTap: () {
                        context.pushNamed(screenLogin);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
