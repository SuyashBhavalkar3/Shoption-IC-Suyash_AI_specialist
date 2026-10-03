import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/pending_approval_screen.dart';
import 'screens/warrior_home_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/pending_users_screen.dart';
import 'screens/org_employees_screen.dart';
import 'screens/warrior_management_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/unified_shell_screen.dart';
import 'app_wrapper.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('⚠️ Firebase initialization failed: $e');
  }
  // Load .env so ApiService can read API_BASE_URL.
  await dotenv.load(fileName: ".env");
  final prefs = await SharedPreferences.getInstance();
  final apiBaseUrl = dotenv.env['API_BASE_URL'] ?? 'https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net';
  await prefs.setString('api_base_url', apiBaseUrl);
  runApp(const ProviderScope(child: CallTrackerApp()));
}


class CallTrackerApp extends StatelessWidget {
  const CallTrackerApp({super.key});


  Future<void> _checkFreshStatusInBackground() async {
    try {
      final user = await ApiService.getMe();
      final isApproved = user['is_approved'] as bool;
      final role = user['role'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_role', role);
      await prefs.setString('user_name', user['full_name']);
      await prefs.setBool('user_is_approved', isApproved);
    } catch (_) {
      // Background checks shouldn't disrupt UI on failure.
      // If it's a 401, the global navigator key handler inside ApiService
      // will handle routing to login automatically.
    }
  }

  Future<Widget> _getInitialScreen() async {
    final token = await ApiService.getToken();
    if (token == null) {
      return const LoginScreen();
    }

    final prefs = await SharedPreferences.getInstance();
    final cachedRole = prefs.getString('user_role');
    final cachedIsApproved = prefs.getBool('user_is_approved') ?? false;

    // Run the API check in the background to update cache without blocking startup.
    // If it fails with a 401, the ApiService global handler redirects to /login.
    _checkFreshStatusInBackground();

    if (cachedRole != null) {
      if (!cachedIsApproved) {
        return const PendingApprovalScreen();
      }
      return const RoleRouterWidget();
    }

    // Fallback if no cached role is found (should be rare if token is present)
    try {
      final user = await ApiService.getMe();
      final isApproved = user['is_approved'] as bool;
      final role = user['role'] as String;

      await prefs.setString('user_role', role);
      await prefs.setString('user_name', user['full_name']);
      await prefs.setBool('user_is_approved', isApproved);

      if (!isApproved) {
        return const PendingApprovalScreen();
      }
      return const RoleRouterWidget();
    } catch (_) {
      return const LoginScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: ApiService.navigatorKey,
      title: 'LeadLens Call Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090D1A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),      // Electric Blue
          secondary: Color(0xFF6366F1),    // Royale Indigo
          surface: Color(0xFF111827),      // Slate surface
          background: Color(0xFF090D1A),   // Slate background
          outline: Color(0xFF1F2937),      // Gray border
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      navigatorObservers: [AppRouteObserver()],
      builder: (context, child) {
        return AppWrapper(child: child!);
      },
      home: FutureBuilder<Widget>(
        future: _getInitialScreen(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: Color(0xFF1F8FFF)),
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
        '/warrior-management': (context) => const WarriorManagementScreen(),
        '/profile': (context) => const ProfileScreen(),
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
          child: CircularProgressIndicator(color: Color(0xFF1F8FFF)),
        ),
      );
    }

    if (_role != null) {
      return const UnifiedShellScreen();
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
  bool _isLoading = false;

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Logout', style: TextStyle(color: Color(0xFFF8FAFC))),
        content: const Text('Are you sure you want to log out?', style: TextStyle(color: Color(0xFF94A3B8))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1F8FFF),
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ApiService.logout();
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF1F8FFF)),
        ),
      );
    }

    final List<Widget> screens = [
      const ReportsScreen(),
      const PendingUsersScreen(),
      const OrgEmployeesScreen(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF1F8FFF),
        unselectedItemColor: const Color(0xFF94A3B8),
        backgroundColor: const Color(0xFF0E1528),
        elevation: 8,
        onTap: (index) {
          final logoutIndex = 3;
          if (index == logoutIndex) {
            _handleLogout();
          } else {
            setState(() {
              _currentIndex = index;
            });
          }
        },
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics),
            label: 'Reports',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Approvals',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.badge_outlined),
            activeIcon: Icon(Icons.badge),
            label: 'Registry',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.logout, color: Color(0xFF2F5C36)),
            label: 'Logout',
          ),
        ],
      ),
    );
  }
}
