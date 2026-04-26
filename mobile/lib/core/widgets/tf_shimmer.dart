import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../theme/app_theme.dart';

class TfShimmer extends StatelessWidget {
  const TfShimmer({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Shimmer.fromColors(
      baseColor: tokens.bgRaised,
      highlightColor: tokens.bgOverlay,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: tokens.bgRaised,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}
