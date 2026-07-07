import 'package:flutter/material.dart';
import '../screens/profile_screen.dart';

class ShoptionAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String subtitle;
  final List<Widget>? actions;
  /// Optional initials to show in the avatar. Pass user's name — initials are derived automatically.
  final String? userInitials;
  final VoidCallback? onProfilePressed;

  const ShoptionAppBar({
    super.key,
    required this.title,
    required this.subtitle,
    this.actions,
    this.userInitials,
    this.onProfilePressed,
  });

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty || name.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final initials = userInitials != null && userInitials!.isNotEmpty
        ? _getInitials(userInitials!)
        : null;

    // Build final actions: profile avatar first, then caller-supplied actions
    final List<Widget> finalActions = [
      // Profile avatar icon
      GestureDetector(
        onTap: () {
          if (onProfilePressed != null) {
            onProfilePressed!();
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ProfileScreen()),
            );
          }
        },
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF1F8FFF), Color(0xFF0A5FBA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1F8FFF).withOpacity(0.25),
                blurRadius: 6,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Center(
            child: Text(
              initials ?? '?',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
      if (actions != null) ...actions!,
    ];

    return AppBar(
      backgroundColor: const Color(0xFF0E1528),
      elevation: 0,
      scrolledUnderElevation: 0,
      iconTheme: const IconThemeData(color: Color(0xFFF8FAFC)),
      // Automatically handle leading widget to show Hamburger menu or Back button
      automaticallyImplyLeading: true,
      title: Row(
        children: [
          Image.asset(
            'assets/logo.png',
            height: 38,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(
              Icons.phone_callback_rounded,
              color: Color(0xFF1F8FFF),
              size: 28,
            ),
          ),
        ],
      ),
      actions: finalActions,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1.0),
        child: Container(
          color: const Color(0xFF1E293B),
          height: 1.0,
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
