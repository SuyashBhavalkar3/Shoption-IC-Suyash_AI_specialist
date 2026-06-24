import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'providers/app_providers.dart';

class AppWrapper extends ConsumerStatefulWidget { 
  final Widget child;
  const AppWrapper({super.key, required this.child});

  @override
  ConsumerState<AppWrapper> createState() => _AppWrapperState();
}

class _AppWrapperState extends ConsumerState<AppWrapper> {
  Timer? _maintenanceTimer;
  Map<String, dynamic>? _maintenanceData;
  String? _userEmail;
  bool _isAdmin = false;
  String _currentVersion = "1.0.2";

  @override
  void initState() {
    super.initState();
    AppRouteObserver.currentRoute.addListener(_onRouteChanged);
    _loadCurrentVersion();
    _loadUserEmail();
    _initMaintenanceListener();
  }

  Future<void> _loadCurrentVersion() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _currentVersion = packageInfo.version;
        });
      }
    } catch (e) {
      debugPrint('⚠️ Failed to load local version name: $e');
    }
  }

  void _onRouteChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _loadUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _userEmail = prefs.getString('user_email');
        _isAdmin = _userEmail == "shoptionspl@gmail.com";
      });
    }
  }

  void _initMaintenanceListener() {
    _fetchMaintenanceStatus();
    // Poll every 10 seconds to get updates in real-time
    _maintenanceTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _fetchMaintenanceStatus();
    });
  }

  Future<void> _fetchMaintenanceStatus() async {
    try {
      final response = await http.get(Uri.parse(
        'https://firestore.googleapis.com/v1/projects/shoption-af244/databases/(default)/documents/maintenance/mode'
      ));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final fields = data['fields'] as Map<String, dynamic>?;
        if (mounted && fields != null) {
          setState(() {
            _maintenanceData = fields;
          });
        }
      } else {
        debugPrint('⚠️ Failed to fetch maintenance status via REST: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('⚠️ Error fetching maintenance status: $e');
    }
  }

  @override
  void dispose() {
    AppRouteObserver.currentRoute.removeListener(_onRouteChanged);
    _maintenanceTimer?.cancel();
    super.dispose();
  }


  @override
  Widget build(BuildContext context) {
    final versionAsync = ref.watch(versionCheckProvider);
    final routeName = AppRouteObserver.currentRoute.value;
    debugPrint('🛡️ AppWrapper build: path=$routeName, dataNull=${_maintenanceData == null}');
    
    if (routeName == '/login' || routeName == '/register') {
      debugPrint('🛡️ Skipping AppWrapper for path=$routeName');
      return widget.child;
    }

    final String remoteVersionFromFirestore = _maintenanceData?["lead_lens_min_version"]?["stringValue"]?.toString() ??
                                              _maintenanceData?["lead_lens_android_version"]?["stringValue"]?.toString() ?? "";

    final bool needsUpdate = versionAsync.when(
      data: (val) => val || (remoteVersionFromFirestore.isNotEmpty && remoteVersionFromFirestore != _currentVersion),
      loading: () => remoteVersionFromFirestore.isNotEmpty && remoteVersionFromFirestore != _currentVersion,
      error: (_, __) => remoteVersionFromFirestore.isNotEmpty && remoteVersionFromFirestore != _currentVersion,
    );

    if (_maintenanceData == null) {
      if (!_isAdmin && needsUpdate) {
        return _buildUpdateScreen();
      }
      return widget.child;
    }

    // Check maintenance mode specifically for lead_lens_android (checking both key variants due to potential tab character)
    final bool isMaintenance = Platform.isAndroid
        ? ((_maintenanceData?["lead_lens_android"]?["booleanValue"] ?? false) ||
           (_maintenanceData?["lead_lens_android\t"]?["booleanValue"] ?? false))
        : false;
    final String message = _maintenanceData?['message']?['stringValue']?.toString() ?? "Under Maintenance";

    debugPrint('🛡️ isMaintenance=$isMaintenance, needsUpdate=$needsUpdate, _isAdmin=$_isAdmin, current=$_currentVersion, remoteFirestore=$remoteVersionFromFirestore');

    if (!_isAdmin) {
      if (needsUpdate) {
        return _buildUpdateScreen();
      }
      if (isMaintenance) {
        return _buildMaintenanceWidget(message);
      }
    }

    return widget.child;
  }

  Widget _buildUpdateScreen() {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Icon(
                  Icons.system_update_rounded,
                  size: 80,
                  color: Color(0xFF04693F),
                ),
                const SizedBox(height: 32),
                const Text(
                  "Update your application\nto the latest version",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF010B26),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "A brand new version of the app is available. Please update your app to use our amazing features.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _launchStore,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF04693F),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      "UPDATE APP",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMaintenanceWidget(String message) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Icon(
                  Icons.construction_rounded,
                  size: 80,
                  color: Color(0xFF04693F),
                ),
                const SizedBox(height: 32),
                const Text(
                  "Under Maintenance",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF010B26),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _launchStore() {
    const url = "https://play.google.com/store/apps/details?id=com.shoption.calltracker";
    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}

class AppRouteObserver extends NavigatorObserver {
  static final ValueNotifier<String?> currentRoute = ValueNotifier<String?>(null);

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    // Use post-frame callback to avoid modifying state during layout/build phase
    WidgetsBinding.instance.addPostFrameCallback((_) {
      currentRoute.value = route.settings.name;
    });
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      currentRoute.value = newRoute?.settings.name;
    });
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      currentRoute.value = previousRoute?.settings.name;
    });
  }
}
