part of '../screens.dart';

class EditInfoScreen extends StatelessWidget {
  const EditInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('Personal Info'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
    );
  }
}
