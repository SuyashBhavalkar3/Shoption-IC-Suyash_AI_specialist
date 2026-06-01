import 'package:flutter/material.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      final token = res['access_token'] as String;
      
      // Decode JWT to extract claims
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      final userId = decodedToken['sub'] as String;
      final role = decodedToken['role'] as String;

      // Save token temporarily to perform profile check
      await ApiService.saveSession(token, role, _emailController.text.trim(), '', userId);

      // Verify user state by hitting /users/me
      final me = await ApiService.getMe();
      final isApproved = me['is_approved'] as bool;
      final fullName = me['full_name'] as String;

      await ApiService.saveSession(
        token,
        role,
        _emailController.text.trim(),
        fullName,
        userId,
      );

      if (!mounted) return;

      if (!isApproved) {
        Navigator.pushReplacementNamed(context, '/pending');
      } else {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 40),
                Center(
                  child: Image.asset(
                    'assets/logo.png',
                    height: 90,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.phone_callback_rounded,
                      size: 80,
                      color: Color(0xFF2F5C36),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Center(
                  child: Text(
                    'SHOPTION',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111111),
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
                const Center(
                  child: Text(
                    'CALL LOGS & HIERARCHY SYNC',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2F5C36),
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 50),
                const Text(
                  'Welcome Back',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111111),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to access your tracking details and dashboards',
                  style: TextStyle(fontSize: 14, color: Color(0xFF666666)),
                ),
                const SizedBox(height: 30),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF2F2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                const Text(
                  'Email Address',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: 'Enter your email',
                    filled: true,
                    fillColor: const Color(0xFFF9F9F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF2F5C36), width: 1.5),
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) return 'Email is required';
                    if (!val.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                const Text(
                  'Password',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Enter your password',
                    filled: true,
                    fillColor: const Color(0xFFF9F9F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF2F5C36), width: 1.5),
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Password is required';
                    return null;
                  },
                ),
                const SizedBox(height: 35),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF111111),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey[300],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            'Sign In',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 25),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Don't have an account? ",
                      style: TextStyle(color: Color(0xFF666666)),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      child: const Text(
                        'Register Now',
                        style: TextStyle(
                          color: Color(0xFF2F5C36),
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    )
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
