class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.preferences = const <String, dynamic>{},
  });

  final String id;
  final String name;
  final String email;
  final Map<String, dynamic> preferences;

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty).toList();
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      preferences: (json['preferences'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{},
    );
  }
}
