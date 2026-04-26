part of '../screens.dart';

class RestPasswordScreen extends StatelessWidget {
  const RestPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const LoginBarIndicator(value: 0),
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
                    'Forgot Password 🔑',
                    style: context.textTheme.headlineMedium,
                  ),
                  const Gap(5),
                  Text(
                    'Enter your email address to get an OTP code to reset your password.',
                    style: context.textTheme.bodySmall,
                  ),
                  const Gap(10),
                  const CardInput(
                    hint: 'Email',
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
                showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (builder) => const DialogPasswordResetDone());

                await Future.delayed(const Duration(seconds: 3)).then((value) {
                  Navigator.pop(context);
                  context.pop();
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
