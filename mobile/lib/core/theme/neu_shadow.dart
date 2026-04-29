import 'package:flutter/material.dart';

List<BoxShadow> neuShadow(bool isDark) => isDark
    ? <BoxShadow>[
        const BoxShadow(
          color: Color(0xFF16191C),
          offset: Offset(4, 4),
          blurRadius: 12,
        ),
        const BoxShadow(
          color: Color(0xFF2C3136),
          offset: Offset(-4, -4),
          blurRadius: 12,
        ),
      ]
    : <BoxShadow>[
        const BoxShadow(
          color: Color(0xFFD1D5DB),
          offset: Offset(4, 4),
          blurRadius: 12,
        ),
        const BoxShadow(
          color: Color(0xFFFFFFFF),
          offset: Offset(-4, -4),
          blurRadius: 12,
        ),
      ];

List<BoxShadow> neuShadowInset(bool isDark) => isDark
    ? <BoxShadow>[
        const BoxShadow(
          color: Color(0xFF16191C),
          offset: Offset(2, 2),
          blurRadius: 6,
          spreadRadius: -1,
        ),
        const BoxShadow(
          color: Color(0xFF2C3136),
          offset: Offset(-2, -2),
          blurRadius: 6,
          spreadRadius: -1,
        ),
      ]
    : <BoxShadow>[
        const BoxShadow(
          color: Color(0xFFD1D5DB),
          offset: Offset(2, 2),
          blurRadius: 6,
          spreadRadius: -1,
        ),
        const BoxShadow(
          color: Color(0xFFFFFFFF),
          offset: Offset(-2, -2),
          blurRadius: 6,
          spreadRadius: -1,
        ),
      ];

List<BoxShadow> neuShadowCard(bool isDark) => isDark
    ? <BoxShadow>[
        const BoxShadow(
          color: Color(0xFF16191C),
          offset: Offset(6, 6),
          blurRadius: 16,
        ),
        const BoxShadow(
          color: Color(0xFF2C3136),
          offset: Offset(-6, -6),
          blurRadius: 16,
        ),
      ]
    : <BoxShadow>[
        const BoxShadow(
          color: Color(0xFFD1D5DB),
          offset: Offset(6, 6),
          blurRadius: 16,
        ),
        const BoxShadow(
          color: Color(0xFFFFFFFF),
          offset: Offset(-6, -6),
          blurRadius: 16,
        ),
      ];
