import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/pending_approval_screen.dart';
import 'screens/warrior_home_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/pending_users_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );
    }
  } catch (e) {
    debugPrint("Failed to initialize Supabase: $e");
  }
  runApp(const CallTrackerApp());
}

class CallTrackerApp extends StatelessWidget {
  const CallTrackerApp({super.key});

  Future<Widget> _getInitialScreen() async {
    final token = await ApiService.getToken();
    if (token == null) {
      return const LoginScreen();
    }

    try {
      final user = await ApiService.getMe();
      final isApproved = user['is_approved'] as bool;
      final role = user['role'] as String;

      // Update cached values in SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_role', role);
      await prefs.setString('user_name', user['full_name']);

      if (!isApproved) {
        return const PendingApprovalScreen();
      }

      if (role == 'warrior') {
        return const WarriorHomeScreen();
      } else {
        // Leaders and admins default directly to Reports/Analytics page
        return const ReportsScreen();
      }
    } catch (_) {
      // If token expired or API failed, fallback to login screen
      return const LoginScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shoption Call Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF111111),
          secondary: Color(0xFFFF6B00),
          surface: Colors.white,
          background: Colors.white,
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: FutureBuilder<Widget>(
        future: _getInitialScreen(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
              ),
            );
          }
          return snapshot.data ?? const LoginScreen();
        },
      ),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/pending': (context) => const PendingApprovalScreen(),
        '/home': (context) => const RoleRouterWidget(),
        '/approvals': (context) => const PendingUsersScreen(),
        '/reports': (context) => const ReportsScreen(),
      },
    );
  }
}

// Routes based on user role when navigating to home.
class RoleRouterWidget extends StatefulWidget {
  const RoleRouterWidget({super.key});

  @override
  State<RoleRouterWidget> createState() => _RoleRouterWidgetState();
}

class _RoleRouterWidgetState extends State<RoleRouterWidget> {
  String? _role;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedRole = prefs.getString('user_role');
    if (cachedRole != null) {
      setState(() {
        _role = cachedRole;
        _isLoading = false;
      });
      return;
    }

    try {
      final user = await ApiService.getMe();
      setState(() {
        _role = user['role'];
      });
    } catch (_) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
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
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
        ),
      );
    }

    if (_role == 'warrior') {
      return const WarriorHomeScreen();
    } else if (_role == 'group_leader') {
      return const ReportsScreen();
    } else if (_role == 'admin' || _role == 'super_admin') {
      // Admin dashboard with bottom navigation to switch between reports and approvals
      return const AdminNavigationShell();
    }

    return const LoginScreen();
  }
}

// A navigation shell containing BottomNavigationBar for admins/super_admins
class AdminNavigationShell extends StatefulWidget {
  const AdminNavigationShell({super.key});

  @override
  State<AdminNavigationShell> createState() => _AdminNavigationShellState();
}

class _AdminNavigationShellState extends State<AdminNavigationShell> {
  int _currentIndex = 0;
  final List<Widget> _screens = [
    const ReportsScreen(),
    const PendingUsersScreen(),
  ];

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Logout', style: TextStyle(color: Color(0xFF111111))),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ApiService.clearSession();
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFFFF6B00),
        unselectedItemColor: const Color(0xFF666666),
        backgroundColor: Colors.white,
        elevation: 8,
        onTap: (index) {
          if (index == 2) {
            // Logout tab
            _handleLogout();
            return;
          }
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics),
            label: 'Analytics',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pending_actions_outlined),
            activeIcon: Icon(Icons.pending_actions),
            label: 'Approvals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.logout, color: Colors.redAccent),
            label: 'Logout',
          ),
        ],
      ),
    );
  }
}
