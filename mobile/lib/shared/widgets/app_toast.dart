import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

enum ToastType { success, error, info }

class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.info,
  }) {
    final overlay = Overlay.of(context);
    late OverlayEntry entry;

    Color bg;
    IconData icon;
    switch (type) {
      case ToastType.success:
        bg = AppColors.success.withValues(alpha: 0.9);
        icon = Icons.check_circle_outline;
      case ToastType.error:
        bg = AppColors.error.withValues(alpha: 0.9);
        icon = Icons.error_outline;
      case ToastType.info:
        bg = AppColors.info.withValues(alpha: 0.9);
        icon = Icons.info_outline;
    }

    entry = OverlayEntry(
      builder: (ctx) => Positioned(
        left: 16,
        right: 16,
        bottom: 96,
        child: _ToastBody(
          icon: icon,
          color: bg,
          message: message,
          onDismissed: () => entry.remove(),
        ),
      ),
    );

    overlay.insert(entry);
    Future<void>.delayed(const Duration(seconds: 3), () {
      if (entry.mounted) entry.remove();
    });
  }
}

class _ToastBody extends StatefulWidget {
  const _ToastBody({
    required this.icon,
    required this.color,
    required this.message,
    required this.onDismissed,
  });

  final IconData icon;
  final Color color;
  final String message;
  final VoidCallback onDismissed;

  @override
  State<_ToastBody> createState() => _ToastBodyState();
}

class _ToastBodyState extends State<_ToastBody>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 300),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 1),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            color: widget.color,
            child: Row(
              children: <Widget>[
                Icon(widget.icon, size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
