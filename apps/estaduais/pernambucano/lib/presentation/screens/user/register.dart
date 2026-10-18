part of '../screens.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    //Toast.dismiss();
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const LoginBarIndicator(value: .2),
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
                    'Create an Account',
                    style: context.textTheme.headlineMedium,
                  ),
                  const Gap(5),
                  Text(
                    'Join the Football Community: Register Now!.',
                    style: context.textTheme.bodySmall,
                  ),
                  const Gap(10),
                  const CardInput(
                    hint: 'Email',
                  ),
                  const Gap(10),
                  const CardInput(
                    hint: 'Password',
                  ),
                  const Gap(10),
                  const CardInput(
                    hint: 'Confirm Password',
                  ),
                  const Gap(10),
                  CheckboxListTile(
                    value: true,
                    onChanged: (value) {},
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(
                      'Accept our Terms and Condition',
                      style: context.textTheme.labelSmall,
                    ),
                  ),
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
                Toast.showLoading();
                await Future.delayed(const Duration(seconds: 3)).then((value) {
                  Toast.dismiss();
                  context.pushNamed(screenProfile);
                });
              },
            ),
          ),
          Gap(context.padding.bottom)
        ],
      ),
    );
  }
}
