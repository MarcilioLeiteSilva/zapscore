part of '../screens.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Security'),
          bottom: TabBar(
            tabs: const [
              Tab(text: 'FAQ'),
              Tab(text: 'Contact us'),
            ],
            labelStyle:
                context.textTheme.bodySmall!.copyWith(color: AppColor.primary),
            unselectedLabelColor: AppColor.hint,
          ),
        ),
        body: TabBarView(
          children: [
            const _FaqPage(),
            ListView(
              padding: const EdgeInsets.symmetric(vertical: 20),
              children: const [
                ContactItem(
                  label: 'Customer Service',
                  icon: FontAwesomeIcons.headphones,
                ),
                Gap(15),
                ContactItem(
                  label: 'Whatsapp',
                  icon: FontAwesomeIcons.whatsapp,
                ),
                Gap(15),
                ContactItem(
                  label: 'Website',
                  icon: FontAwesomeIcons.globe,
                ),
                Gap(15),
                ContactItem(
                  label: 'Facebook',
                  icon: FontAwesomeIcons.facebook,
                ),
                Gap(15),
                ContactItem(
                  label: 'Twitter',
                  icon: FontAwesomeIcons.twitter,
                ),
                Gap(15),
                ContactItem(
                  label: 'Instagram',
                  icon: FontAwesomeIcons.instagram,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ContactItem extends StatelessWidget {
  const ContactItem(
      {super.key, required this.label, required this.icon, this.onTap});
  final String label;
  final dynamic icon;
  final Function()? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: InkWell(
        onTap: onTap,
        child: Ink(
          width: context.width,
          decoration: BoxDecoration(
            color: AppColor.card,
            border: Border.all(
              color: AppColor.info,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              FaIcon(
                icon,
                color: AppColor.primary,
              ),
              const Gap(15),
              Text(
                label,
                style: context.textTheme.bodyMedium!.copyWith(
                  fontSize: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

///FAQ PAGE

class _FaqPage extends StatefulWidget {
  const _FaqPage();

  @override
  State<_FaqPage> createState() => _FaqPageState();
}

class _FaqPageState extends State<_FaqPage> {
  int indexTab = 0;
  int selectFaq = 0;

  List<String> listTabs = [
    "General",
    "Account",
    "Service",
    "Payment",
    "Notification",
    "Advertisement",
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 10),
      children: [
        Container(
          width: context.width,
          height: 60,
          color: AppColor.background,
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Material(
            color: Colors.transparent,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemBuilder: (_, i) {
                return CardCheepTabSearch(
                  select: indexTab == i,
                  label: listTabs[i],
                  onTap: () {
                    setState(() {
                      indexTab = i;
                    });
                  },
                );
              },
              separatorBuilder: (_, i) => const Gap(10),
              itemCount: listTabs.length,
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.all(10.0),
          child: CardSearchFollow(label: 'Search'),
        ),
        const Gap(10),
        FaqItem(
          label: 'What is ${AppText.appName}?',
          select: selectFaq == 0,
          onTap: () {
            setState(() {
              selectFaq = 0;
            });
          },
        ),
        const Gap(20),
        FaqItem(
          label: 'What are the services in ${AppText.appName}?',
          select: selectFaq == 1,
          onTap: () {
            setState(() {
              selectFaq = 1;
            });
          },
        ),
        const Gap(20),
        FaqItem(
          label: 'Can i stream sports on ${AppText.appName}?',
          select: selectFaq == 2,
          onTap: () {
            setState(() {
              selectFaq = 2;
            });
          },
        ),
        const Gap(20),
        FaqItem(
          label: 'How can I contact the support?',
          select: selectFaq == 3,
          onTap: () {
            setState(() {
              selectFaq = 3;
            });
          },
        ),
        const Gap(20),
        FaqItem(
          label: 'How to close an ${AppText.appName} Account?',
          select: selectFaq == 4,
          onTap: () {
            setState(() {
              selectFaq = 4;
            });
          },
        ),
      ],
    );
  }
}

class FaqItem extends StatelessWidget {
  const FaqItem(
      {super.key, required this.label, this.select = false, this.onTap});
  final String label;
  final bool select;
  final Function()? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Ink(
        width: context.width,
        decoration: BoxDecoration(
          color: AppColor.card,
          border: Border.all(
            color: AppColor.info,
            width: 1,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(15),
        child: Column(
          children: [
            InkWell(
              onTap: onTap,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label,
                    style: context.textTheme.bodyMedium!.copyWith(
                      fontSize: 18,
                    ),
                  ),
                  const Icon(
                    Icons.arrow_drop_down,
                    color: AppColor.primary,
                  ),
                ],
              ),
            ),
            if (select) ...[
              const Divider(height: 30),
              Text(
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                style: context.textTheme.labelSmall,
              )
            ],
          ],
        ),
      ),
    );
  }
}
