part of '../screens.dart';

class EditInfoScreen extends StatefulWidget {
  const EditInfoScreen({super.key});

  @override
  State<EditInfoScreen> createState() => _EditInfoScreenState();
}

class _EditInfoScreenState extends State<EditInfoScreen> {
  late TextEditingController _nameController;
  late TextEditingController _nicknameController;
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final state = context.read<SettingCubit>().state;
    _nameController = TextEditingController(text: state.userName);
    _nicknameController = TextEditingController(text: state.userNickname);
    if (state.userPhoto != null) {
      _imageFile = File(state.userPhoto!);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _imageFile = File(image.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('personal_info'.tr(context)),
        actions: [
          TextButton(
            onPressed: () async {
              await context.read<SettingCubit>().updateProfile(
                    name: _nameController.text,
                    nickname: _nicknameController.text,
                    photo: _imageFile?.path,
                  );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Salvo com sucesso!')),
                );
                context.pop();
              }
            },
            child: Text(
              'save'.tr(context),
              style: TextStyle(color: Theme.of(context).primaryColor),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Gap(20),
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Theme.of(context).primaryColor, width: 3),
                    image: _imageFile != null
                        ? DecorationImage(
                            image: FileImage(_imageFile!),
                            fit: BoxFit.cover,
                          )
                        : const DecorationImage(
                            image: NetworkImage(AppText.avatar),
                            fit: BoxFit.cover,
                          ),
                  ),
                ),
                InkWell(
                  onTap: _pickImage,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: SvgPicture.asset(
                      Assets.edit,
                      width: 20,
                      color: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
            const Gap(10),
            TextButton(
              onPressed: _pickImage,
              child: Text('edit_photo'.tr(context)),
            ),
            const Gap(30),
            _buildInputField(context, 'name'.tr(context), _nameController),
            const Gap(20),
            _buildInputField(context, 'nickname'.tr(context), _nicknameController),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(BuildContext context, String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: context.textTheme.labelLarge!.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const Gap(8),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: label,
            filled: true,
            fillColor: Theme.of(context).cardColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }
}
