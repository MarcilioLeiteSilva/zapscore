part of '../screens.dart';

class FollowScreen extends StatefulWidget {
  const FollowScreen({super.key});

  @override
  State<FollowScreen> createState() => _FollowScreenState();
}

class _FollowScreenState extends State<FollowScreen> {
  int indexPage = 0;
  final PageController controller = PageController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: LoginBarIndicator(value: [.6, .8, 1.0][indexPage]),
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: controller,
              onPageChanged: (int value) {
                setState(() {
                  indexPage = value;
                });
              },
              children: const [
                FollowTeams(),
                FollowLeague(),
                FollowNotification(),
              ],
            ),
          ),
          const Divider(height: 0),
          const Gap(15),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                if (indexPage != 2) ...[
                  Expanded(
                    child: CardLogin(
                      label: 'Skip',
                      color: AppColor.info,
                      onTap: () {},
                    ),
                  ),
                  const Gap(10),
                ],
                Expanded(
                  child: CardLogin(
                    label: indexPage != 2 ? 'Continue' : 'Finish',
                    onTap: () async {
                      if (indexPage != 2) {
                        indexPage++;
                        controller.animateToPage(indexPage,
                            duration:const Duration(milliseconds: 300),
                            curve: Curves.linear);
                        setState(() {});
                      } else {
                        showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (builder) => const DialogProfileDone());

                        await Future.delayed(const Duration(seconds: 3))
                            .then((value) {
                          context.pushNamed(screenHome);
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          Gap(context.padding.bottom)
        ],
      ),
    );
  }
}
