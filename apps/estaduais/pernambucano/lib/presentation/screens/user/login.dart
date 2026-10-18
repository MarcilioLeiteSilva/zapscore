part of '../screens.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const LoginBarIndicator(value: 1),
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
                    'Hello there 👋',
                    style: context.textTheme.headlineMedium,
                  ),
                  const Gap(5),
                  Text(
                    'Enter email and password. If you forget, then you have to do forget password.',
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
                  const Gap(20),
                  CheckboxListTile(
                    value: true,
                    onChanged: (value) {},
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(
                      'Remember me',
                      style: context.textTheme.labelSmall,
                    ),
                  ),
                  const Divider(
                    height: 30,
                    indent: 20,
                    endIndent: 20,
                  ),
                  const Gap(15),
                  Center(
                    child: InkWell(
                      onTap: () => context.pushNamed(screenRestPass),
                      child: Text(
                        'Forgot Password?',
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
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
              label: 'Sign In',
              onTap: () async {
                Toast.showLoading();
                await Future.delayed(const Duration(seconds: 3)).then((value) {
                  Toast.dismiss();
                  context.pushNamed(screenHome);
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
