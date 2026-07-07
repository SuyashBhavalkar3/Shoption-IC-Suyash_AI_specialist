import 'package:flutter/material.dart';

class PermissionDisclosureScreen extends StatefulWidget {
  final VoidCallback onAccept;
  final VoidCallback onDeny;

  const PermissionDisclosureScreen({
    super.key,
    required this.onAccept,
    required this.onDeny,
  });

  @override
  State<PermissionDisclosureScreen> createState() => _PermissionDisclosureScreenState();
}

class _PermissionDisclosureScreenState extends State<PermissionDisclosureScreen> {
  bool _privacyAccepted = false;
  bool _termsAccepted = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050816),
      appBar: AppBar(
        backgroundColor: const Color(0xFF050816),
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png',
              height: 28,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.analytics,
                color: Color(0xFF1F8FFF),
                size: 28,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'LeadLens Tracker',
              style: TextStyle(
                color: Color(0xFFF8FAFC),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: Icon(
                        Icons.security_outlined,
                        size: 48,
                        color: Color(0xFF1F8FFF),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Prominent Disclosure & Consent',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF8FAFC),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'LeadLens is an enterprise tracking utility. To automate the logging of your customer sales calls, this application requires access to background phone activities.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildDisclosureItem(
                      icon: Icons.phone_android_rounded,
                      title: 'Phone State Monitoring',
                      description:
                          'Detects incoming and outgoing call status changes to trigger immediate data syncing.',
                    ),
                    _buildDisclosureItem(
                      icon: Icons.history,
                      title: 'Call Log Access',
                      description:
                          'Automatically reads phone numbers, timestamps, call duration, and call status for performance reporting.',
                    ),
                    _buildDisclosureItem(
                      icon: Icons.notifications_active_outlined,
                      title: 'Foreground Service Run',
                      description:
                          'Keeps call detection alive in the background with a persistent notification, even when the application is closed.',
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Privacy & Sharing Notice',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF8FAFC),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'We collect and securely transmit your business call metrics to your private organization portal. Your personal call logs are never shared with third parties.',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF94A3B8),
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              decoration: const BoxDecoration(
                color: Color(0xFF0E1528),
                border: Border(
                  top: BorderSide(color: Color(0xFF1E293B), width: 1.5),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 20,
                        width: 20,
                        child: Checkbox(
                          value: _privacyAccepted,
                          activeColor: const Color(0xFF1F8FFF),
                          checkColor: Colors.white,
                          side: const BorderSide(color: Color(0xFF1E293B)),
                          onChanged: (val) {
                            setState(() {
                              _privacyAccepted = val ?? false;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'I agree to the Privacy Policy and call data collection.',
                          style: TextStyle(fontSize: 11, color: Color(0xFFF8FAFC), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 20,
                        width: 20,
                        child: Checkbox(
                          value: _termsAccepted,
                          activeColor: const Color(0xFF1F8FFF),
                          checkColor: Colors.white,
                          side: const BorderSide(color: Color(0xFF1E293B)),
                          onChanged: (val) {
                            setState(() {
                              _termsAccepted = val ?? false;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'I agree to the Terms & Conditions of enterprise tracking.',
                          style: TextStyle(fontSize: 11, color: Color(0xFFF8FAFC), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: (_privacyAccepted && _termsAccepted) ? widget.onAccept : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1F8FFF),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFF0E1528).withOpacity(0.5),
                      disabledForegroundColor: Colors.grey.shade600,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'I Agree & Proceed',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: widget.onDeny,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: const BorderSide(color: Color(0xFFE11D48)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'No Thanks, Deny',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFFE11D48),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDisclosureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF1F8FFF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF1F8FFF),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
