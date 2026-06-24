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
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png',
              height: 32,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.analytics,
                color: Color(0xFF04693F),
                size: 32,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'LeadLens Tracker',
              style: TextStyle(
                color: Color(0xFF010B26),
                fontWeight: FontWeight.bold,
                fontSize: 18,
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
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: Icon(
                        Icons.security_outlined,
                        size: 72,
                        color: Color(0xFF04693F),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Prominent Disclosure & Consent',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF010B26),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'LeadLens is an enterprise tracking utility. To automate the logging of your customer sales calls, this application requires access to background phone activities.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF666666),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildDisclosureItem(
                      icon: Icons.phone_android_rounded,
                      title: 'Phone State Monitoring',
                      description:
                          'Detects incoming and outgoing call status changes (e.g., when a call starts or hangs up) to trigger immediate data syncing.',
                    ),
                    _buildDisclosureItem(
                      icon: Icons.history,
                      title: 'Call Log Access',
                      description:
                          'Automatically reads phone numbers, timestamps, call duration, and call status (answered/dialed/missed) for sales performance reporting.',
                    ),
                    _buildDisclosureItem(
                      icon: Icons.notifications_active_outlined,
                      title: 'Foreground Service Run',
                      description:
                          'Keeps call detection and synchronization alive in the background with a persistent notification, even when the application is closed or not actively in use.',
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Privacy & Sharing Notice',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF010B26),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'We collect and securely transmit your business call metrics to your private organization portal. Your personal call logs are never shared with third parties or advertisers.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF666666),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(20.0),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 24,
                        width: 24,
                        child: Checkbox(
                          value: _privacyAccepted,
                          activeColor: const Color(0xFF04693F),
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
                          style: TextStyle(fontSize: 12.5, color: Color(0xFF444444), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 24,
                        width: 24,
                        child: Checkbox(
                          value: _termsAccepted,
                          activeColor: const Color(0xFF04693F),
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
                          style: TextStyle(fontSize: 12.5, color: Color(0xFF444444), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: (_privacyAccepted && _termsAccepted) ? widget.onAccept : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF04693F),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      disabledForegroundColor: Colors.grey.shade600,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'I Agree & Proceed',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: widget.onDeny,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'No Thanks, Deny',
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF666666),
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
      padding: const EdgeInsets.only(bottom: 20.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF04693F).withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF04693F),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF010B26),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF666666),
                    height: 1.4,
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
