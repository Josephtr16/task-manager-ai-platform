import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/app_colors.dart';
import '../models/task_model.dart';
import 'task_card.dart';

// TaskCard has margin: symmetric(horizontal: 16, vertical: 6) internally.
// All Positioned boxes must use the same offsets so they align with the
// visual card edges — not the screen edges.
const double _cardHMargin = 16.0;
const double _cardVMargin = 6.0;

class SwipeableTaskCard extends StatefulWidget {
  const SwipeableTaskCard({
    super.key,
    required this.task,
    required this.onTap,
    required this.onComplete,
    required this.onOptions,
  });

  final TaskModel task;
  final VoidCallback onTap;
  final VoidCallback onComplete;
  final VoidCallback onOptions;

  @override
  State<SwipeableTaskCard> createState() => _SwipeableTaskCardState();
}

class _SwipeableTaskCardState extends State<SwipeableTaskCard>
    with SingleTickerProviderStateMixin {

  static const double _maxOffset  = 88.0;
  static const double _triggerOffset = 55.0;

  late final AnimationController _ctrl;
  late Animation<double> _snapAnim;
  double _offset = 0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  // Accumulate each frame's delta — do NOT use dragStartOffset
  void _onDragUpdate(DragUpdateDetails d) {
    setState(() {
      _offset = (_offset + d.delta.dx).clamp(-_maxOffset, _maxOffset);
    });
  }

  void _onDragEnd(DragEndDetails d) {
    if (_offset > _triggerOffset) {
      HapticFeedback.lightImpact();
      _snapBack();
      widget.onComplete();
    } else if (_offset < -_triggerOffset) {
      HapticFeedback.lightImpact();
      _snapBack();
      widget.onOptions();
    } else {
      _snapBack();
    }
  }

  void _snapBack() {
    final double start = _offset;
    _ctrl.reset();
    _snapAnim = Tween<double>(begin: start, end: 0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut),
    )..addListener(() => setState(() => _offset = _snapAnim.value));
    _ctrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onHorizontalDragUpdate: _onDragUpdate,
      onHorizontalDragEnd: _onDragEnd,
      child: IntrinsicHeight(
        child: Stack(
          clipBehavior: Clip.none,
          children: <Widget>[

            // ── Complete (sage) ── only when swiping RIGHT
            // Inset by _cardHMargin / _cardVMargin to align with visual card edges
            if (_offset > 0)
              Positioned(
                left:   _cardHMargin,
                top:    _cardVMargin,
                bottom: _cardVMargin,
                width:  _offset,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sage,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: _offset > 36
                      ? const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Icon(Icons.check_rounded, color: Colors.white, size: 22),
                            SizedBox(height: 3),
                            Text(
                              'Complete',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ),

            // ── Options (rose) ── only when swiping LEFT
            if (_offset < 0)
              Positioned(
                right:  _cardHMargin,
                top:    _cardVMargin,
                bottom: _cardVMargin,
                width:  -_offset,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColorsShared.accent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: _offset.abs() > 36
                      ? const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Icon(Icons.more_horiz_rounded, color: Colors.white, size: 22),
                            SizedBox(height: 3),
                            Text(
                              'Options',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ),

            // ── Card slides on top ──
            Transform.translate(
              offset: Offset(_offset, 0),
              child: TaskCard(
                task: widget.task,
                onTap: widget.onTap,
              ),
            ),

          ],
        ),
      ),
    );
  }
}