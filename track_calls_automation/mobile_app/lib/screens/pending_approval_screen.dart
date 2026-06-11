import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PendingApprovalScreen extends StatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  State<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<PendingApprovalScreen> {
  bool _checking = false;

  Future<void> _checkStatus(BuildContext context) async {
    if (_checking) return;
    setState(() {
      _checking = true;
    });

    try {
      final user = await ApiService.getMe();
      final isApproved = user['is_approved'] as bool;
      
      if (!mounted) return;
      
      if (isApproved) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account approved! Logging in...')),
        );
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account still pending approval.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to check status: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _checking = false;
        });
      }
    }
  }

  Future<void> _logout(BuildContext context) async {
    await ApiService.clearSession();
    if (context.mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),
              Image.asset(
                'assets/logo.png',
                height: 80,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.phone_callback_rounded,
                  size: 80,
                  color: Color(0xFF04693F),
                ),
              ),
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9F9F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFEEEEEE)),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.hourglass_empty_rounded,
                      size: 48,
                      color: Color(0xFF04693F),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Approval Pending',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF010B26),
                      ),
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Your registration request has been submitted successfully. Please wait while an administrator approves your account.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF666666),
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: _checking ? null : () => _checkStatus(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF010B26),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _checking
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Check Approval Status',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _logout(context),
                icon: const Icon(Icons.logout, color: Color(0xFF04693F)),
                label: const Text(
                  'Logout',
                  style: TextStyle(
                    color: Color(0xFF04693F),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
