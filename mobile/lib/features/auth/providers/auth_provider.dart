import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/auth_service.dart';
import '../../../services/api_service.dart';
import '../models/user_model.dart';

class AuthState {
  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = true,
  });

  final UserModel? user;
  final bool isAuthenticated;
  final bool isLoading;

  AuthState copyWith({
    UserModel? user,
    bool? isAuthenticated,
    bool? isLoading,
  }) {
    return AuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    ApiService.onUnauthorized = () async {
      await logout();
    };

    final authService = ref.read(authServiceProvider);
    final token = await authService.getToken();
    if (token == null || token.isEmpty) {
      return const AuthState(isAuthenticated: false, isLoading: false);
    }

    try {
      final me = await authService.getMe();
      final userJson = (me['user'] ?? me) as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);
      return AuthState(user: user, isAuthenticated: true, isLoading: false);
    } catch (_) {
      await authService.logout();
      return const AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    final authService = ref.read(authServiceProvider);
    final response = await authService.login(email, password);
    final userJson = (response['user'] ?? const <String, dynamic>{}) as Map<String, dynamic>;
    state = AsyncData(AuthState(user: UserModel.fromJson(userJson), isAuthenticated: true, isLoading: false));
  }

  Future<void> register(String name, String email, String password) async {
    await ref.read(authServiceProvider).register(name, email, password);
  }

  Future<void> logout() async {
    await ref.read(authServiceProvider).logout();
    state = const AsyncData(AuthState(isAuthenticated: false, isLoading: false));
  }
}
