part of '../screens.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const LoginBarIndicator(value: .4),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Complete Your Profile',
                    style: context.textTheme.headlineMedium,
                  ),
                  const Gap(5),
                  Text(
                    'Complete your profile now, or you can skip\nand fill it out later.',
                    style: context.textTheme.bodySmall,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          const CircleAvatar(
                            radius: 60,
                            backgroundColor: Colors.white,
                            backgroundImage: NetworkImage(AppText.avatar),
                          ),
                          InkWell(
                            onTap: () {},
                            child: SvgPicture.asset(Assets.editImage),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const CardInput(
                    hint: 'Full Name',
                  ),
                  const Gap(10),
                  const CardInput(
                    hint: 'Phone Number',
                  ),
                  const Gap(10),
                  const CardBirth(),
                ],
              ),
            ),
          ),
          const Divider(),
          const Gap(15),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CardLogin(
              label: 'Continue',
              onTap: () async {
                context.pushNamed(screenFollow);
              },
            ),
          ),
          Gap(context.padding.bottom)
        ],
      ),
    );
  }
}
