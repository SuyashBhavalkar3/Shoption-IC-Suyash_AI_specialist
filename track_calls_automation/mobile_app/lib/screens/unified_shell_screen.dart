import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import '../services/api_service.dart';
import 'warrior_home_screen.dart';
import 'reports_screen.dart';
import 'pending_users_screen.dart';
import 'org_employees_screen.dart';
import 'warrior_management_screen.dart';
import 'profile_screen.dart';
import 'permission_disclosure_screen.dart';
import '../widgets/shoption_app_bar.dart';

class UnifiedShellScreen extends StatefulWidget {
  const UnifiedShellScreen({super.key});

  @override
  State<UnifiedShellScreen> createState() => _UnifiedShellScreenState();
}

class _UnifiedShellScreenState extends State<UnifiedShellScreen> {
  static const platform = MethodChannel('com.shoption.calltracker/tracking');
  
  String _userName = '';
  String _userRole = '';
  String _userEmail = '';
  bool _isLoading = true;
  String _activeRoute = 'dashboard'; // 'dashboard', 'reports', 'approvals', 'employees', 'management', 'profile'

  int _totalDuration = 0;
  int _incomingCount = 0;
  int _outgoingCount = 0;

  bool isTrackingActive = false;
  bool permissionsGranted = false;
  bool _isToggling = false;
  bool _isSyncing = false;
  Timer? _statusPingTimer;

  // Azure cloud stats
  Map<String, dynamic>? _azureStats;
  bool _loadingAzureStats = false;

  @override
  void initState() {
    super.initState();
    _loadUserData().then((_) {
      _syncCallLogs();
      try {
        const platform = MethodChannel('com.shoption.calltracker/tracking');
        platform.invokeMethod('ensureTracking');
      } catch (_) {}
    });
    _checkTrackingStatus();
    _setupMethodChannelListener();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _setupMethodChannelListener() {
    platform.setMethodCallHandler((call) async {
      if (call.method == 'onNewCallLogged') {
        debugPrint('🔔 Native call logged! Syncing logs for admin/user...');
        await _syncCallLogs();
      }
    });
  }

  Future<void> _syncCallLogs() async {
    if (_isSyncing) return;
    setState(() {
      _isSyncing = true;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final currentUid = prefs.getString('user_id') ?? '';
      if (currentUid.isEmpty) return;

      final databasePath = await sqfliteDatabasePath();
      final path = '$databasePath/call_tracker.db';
      final database = await openDatabase(path, version: 4);

      // Find all unsynced logs for active user
      final List<Map<String, dynamic>> unsynced = await database.query(
        'call_logs',
        where: 'is_synced = 0 AND user_id = ?',
        whereArgs: [currentUid],
      );

      if (unsynced.isNotEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Syncing ${unsynced.length} new calls to server...'),
              duration: const Duration(seconds: 2),
            ),
          );
        }
        try {
          final payload = unsynced.map((log) => {
            'phone_number': log['phone_number'] ?? 'Unknown',
            'call_type': log['call_type'] ?? 'Unknown',
            'duration_seconds': (log['duration_seconds'] as num? ?? 0).toInt(),
            'timestamp': log['timestamp'] ?? 'Unknown',
            'system_call_id': log['system_call_id'] ?? '',
          }).toList();

          await ApiService.syncCalls(payload);

          // Mark all as synced locally
          await database.transaction((txn) async {
            for (final log in unsynced) {
              await txn.update(
                'call_logs',
                {'is_synced': 1},
                where: 'id = ?',
                whereArgs: [log['id']],
              );
            }
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Successfully synced ${unsynced.length} calls!'),
                backgroundColor: const Color(0xFF10B981),
                duration: const Duration(seconds: 2),
              ),
            );
          }
        } catch (e) {
          debugPrint('Failed to sync batch: $e');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Sync failed: $e'),
                backgroundColor: const Color(0xFFEF4444),
                duration: const Duration(seconds: 4),
              ),
            );
          }
        }
      }
      await database.close();
    } catch (e) {
      debugPrint('Sync error: $e');
    } finally {
      setState(() {
        _isSyncing = false;
      });
      // Load local sqflite database stats again to update UI counters
      try {
        final prefs = await SharedPreferences.getInstance();
        final cachedUid = prefs.getString('user_id') ?? '';
        final databasePath = await sqfliteDatabasePath();
        final path = '$databasePath/call_tracker.db';
        final database = await openDatabase(path, version: 4);
        final List<Map<String, dynamic>> maps = await database.query(
          'call_logs',
          where: 'user_id = ?',
          whereArgs: [cachedUid],
        );
        int incoming = 0;
        int outgoing = 0;
        int dur = 0;
        for (final log in maps) {
          final type = (log['call_type'] ?? '').toString().toLowerCase();
          final duration = (log['duration_seconds'] as num? ?? 0).toInt();
          if (type == 'outgoing') {
            outgoing++;
            dur += duration;
          } else {
            incoming++;
            if (type == 'incoming') {
              dur += duration;
            }
          }
        }
        setState(() {
          _incomingCount = incoming;
          _outgoingCount = outgoing;
          _totalDuration = dur;
        });
        await database.close();
      } catch (_) {}
      await _loadAzureStats();
    }
  }

  Future<void> _checkTrackingStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final consentAccepted = prefs.getBool('consent_accepted') ?? false;
      final bool active = await platform.invokeMethod('isTrackingActive');
      final bool hasPerms = await platform.invokeMethod('hasCallPermissions');
      final bool granted = consentAccepted && hasPerms;
      
      debugPrint('[TRACKING STATUS CHECK] active=$active, nativePerms=$hasPerms, consentAccepted=$consentAccepted, UI_granted=$granted');

      setState(() {
        isTrackingActive = active;
        permissionsGranted = granted;
      });
    } catch (e) {
      debugPrint('[TRACKING STATUS CHECK ERROR] $e');
    }
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedRole = prefs.getString('user_role') ?? 'warrior';
    final cachedUid = prefs.getString('user_id') ?? '';
    setState(() {
      _userName = prefs.getString('user_name') ?? 'User';
      _userRole = cachedRole;
      _userEmail = prefs.getString('user_email') ?? '';
      _isLoading = false;
    });

    try {
      final user = await ApiService.getMe();
      setState(() {
        _userName = user['full_name'] ?? _userName;
        _userRole = user['role'] ?? _userRole;
        _userEmail = user['email'] ?? _userEmail;
      });
      await prefs.setString('user_name', _userName);
      await prefs.setString('user_role', _userRole);
      await prefs.setString('user_email', _userEmail);
    } catch (_) {}

    // Load Local sqflite database call stats to display on home console
    try {
      final databasePath = await sqfliteDatabasePath();
      final path = '$databasePath/call_tracker.db';
      final database = await openDatabase(
        path,
        version: 4,
        onCreate: (db, version) async {
          await db.execute('''
            CREATE TABLE call_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              phone_number TEXT,
              call_type TEXT,
              duration_seconds INTEGER,
              timestamp TEXT,
              system_call_id TEXT UNIQUE,
              is_synced INTEGER DEFAULT 0,
              user_id TEXT
            )
          ''');
        },
        onUpgrade: (db, oldVersion, newVersion) async {
          final List<Map<String, dynamic>> columns = await db.rawQuery('PRAGMA table_info(call_logs)');
          final columnNames = columns.map((c) => c['name'] as String).toList();

          if (!columnNames.contains('system_call_id')) {
            await db.execute('ALTER TABLE call_logs ADD COLUMN system_call_id TEXT UNIQUE');
          }
          if (!columnNames.contains('is_synced')) {
            await db.execute('ALTER TABLE call_logs ADD COLUMN is_synced INTEGER DEFAULT 0');
          }
          if (!columnNames.contains('user_id')) {
            await db.execute('ALTER TABLE call_logs ADD COLUMN user_id TEXT');
          }
        },
      );

      // One-time migration to reset sync status for any call logs that failed to sync previously due to the server ID collision bug
      final resynced = prefs.getBool('resync_v1_done') ?? false;
      if (!resynced) {
        try {
          await database.rawUpdate('UPDATE call_logs SET is_synced = 0');
          await prefs.setBool('resync_v1_done', true);
          debugPrint('🔄 One-time sync reset: Set all local call logs to unsynced for recovery.');
        } catch (e) {
          debugPrint('Failed to run one-time sync reset: $e');
        }
      }

      final List<Map<String, dynamic>> maps = await database.query(
        'call_logs',
        where: 'user_id = ?',
        whereArgs: [cachedUid.isNotEmpty ? cachedUid : (prefs.getString('user_id') ?? '')],
      );
      int incoming = 0;
      int outgoing = 0;
      int dur = 0;
      for (final log in maps) {
        final type = (log['call_type'] ?? '').toString().toLowerCase();
        final duration = (log['duration_seconds'] as num? ?? 0).toInt();
        if (type == 'outgoing') {
          outgoing++;
          dur += duration;
        } else {
          incoming++;
          if (type == 'incoming') {
            dur += duration;
          }
        }
      }
      setState(() {
        _incomingCount = incoming;
        _outgoingCount = outgoing;
        _totalDuration = dur;
      });
      await database.close();
    } catch (e) {
      debugPrint('Welcome stats load error: $e');
    }
    
    // Fetch stats from Azure PostgreSQL
    await _loadAzureStats();
  }

  Future<void> _loadAzureStats() async {
    if (!mounted) return;
    setState(() {
      _loadingAzureStats = true;
    });
    try {
      final stats = await ApiService.fetchMyCallStats();
      if (mounted) {
        setState(() {
          _azureStats = stats;
        });
      }
    } catch (e) {
      debugPrint('Welcome stats load error from Azure: $e');
    } finally {
      if (mounted) {
        setState(() {
          _loadingAzureStats = false;
        });
      }
    }
  }

  Future<String> sqfliteDatabasePath() async {
    return await getDatabasesPath();
  }

  String _formatDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final secs = twoDigits(duration.inSeconds.remainder(60));
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${minutes}m ${secs}s';
    }
    return '${minutes}m ${secs}s';
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Logout', style: TextStyle(color: Color(0xFFF8FAFC))),
        content: const Text(
          'Are you sure you want to log out?',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      // 1. Explicitly stop native tracking service first
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('tracking_toggled_active', false);
        const platform = MethodChannel('com.shoption.calltracker/tracking');
        await platform.invokeMethod('logoutStopService');
        try {
          await ApiService.updateMyTrackingActive(false);
        } catch (_) {}
      } catch (e) {
        debugPrint('Error stopping native service on logout: $e');
      }

      // 2. Clear credentials and session on server
      await ApiService.logout();
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  String _getRoleLabel(String role) {
    switch (role.toLowerCase()) {
      case 'warrior':
        return 'Warrior (Call Tracking Agent)';
      case 'group_leader':
        return 'Group Leader';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role;
    }
  }

  Widget _buildDrawer() {
    final bool isGL = _userRole == 'group_leader';
    final bool isAdmin = _userRole == 'admin' || _userRole == 'super_admin';

    return Drawer(
      backgroundColor: const Color(0xFF0E1528),
      child: Column(
        children: [
          // Drawer Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
            decoration: const BoxDecoration(
              color: Color(0xFF050816),
              border: Border(bottom: BorderSide(color: Color(0xFF1E293B), width: 1.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: const Color(0xFF1F8FFF),
                  child: Text(
                    _userName.isNotEmpty ? _userName[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _userName,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC), fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  _userEmail,
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F8FFF).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF1F8FFF).withOpacity(0.5), width: 0.5),
                  ),
                  child: Text(
                    _getRoleLabel(_userRole),
                    style: const TextStyle(color: Color(0xFF1F8FFF), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          // Drawer Navigation Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildDrawerItem(
                  icon: Icons.dashboard_rounded,
                  title: 'Console Home',
                  route: 'dashboard',
                ),
                _buildDrawerItem(
                  icon: Icons.my_location_rounded,
                  title: 'My Tracking',
                  route: 'tracking',
                ),
                if (isAdmin || isGL)
                  _buildDrawerItem(
                    icon: Icons.analytics_rounded,
                    title: 'Team Analytics Reports',
                    route: 'reports',
                  ),
                if (isAdmin) ...[
                  _buildDrawerItem(
                    icon: Icons.people_rounded,
                    title: 'Pending Approvals',
                    route: 'approvals',
                  ),
                  _buildDrawerItem(
                    icon: Icons.badge_rounded,
                    title: 'Employee Registry',
                    route: 'employees',
                  ),
                  _buildDrawerItem(
                    icon: Icons.manage_accounts_rounded,
                    title: 'User Management',
                    route: 'management',
                  ),
                ],
                _buildDrawerItem(
                  icon: Icons.account_circle_rounded,
                  title: 'My Profile',
                  route: 'profile',
                ),
              ],
            ),
          ),
          // Drawer Footer Logout Button
          const Divider(color: Color(0xFF1E293B)),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Color(0xFFE11D48)),
            title: const Text('Sign Out', style: TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.bold)),
            onTap: () {
              Navigator.pop(context);
              _handleLogout();
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required String route,
  }) {
    final bool isSelected = _activeRoute == route;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? const Color(0xFF1F8FFF) : const Color(0xFF94A3B8),
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFFF8FAFC) : const Color(0xFF94A3B8),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: const Color(0xFF1F8FFF).withOpacity(0.1),
      onTap: () {
        setState(() {
          _activeRoute = route;
        });
        Navigator.pop(context);
      },
    );
  }

  Widget _buildWelcomeContent() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text(
            'Welcome back,',
            style: TextStyle(fontSize: 16, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 4),
          Text(
            _userName,
            style: const TextStyle(fontSize: 28, color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF1F8FFF).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF1F8FFF).withOpacity(0.3), width: 0.5),
            ),
            child: Text(
              _getRoleLabel(_userRole).toUpperCase(),
              style: const TextStyle(color: Color(0xFF1F8FFF), fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0E1528),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Call Tracking Control Panel',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Permissions Granted:',
                      style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                    ),
                    Row(
                      children: [
                        Icon(
                          permissionsGranted ? Icons.check_circle_rounded : Icons.cancel_rounded,
                          color: permissionsGranted ? const Color(0xFF00E6B8) : const Color(0xFFE11D48),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          permissionsGranted ? 'Yes' : 'No',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: permissionsGranted ? const Color(0xFF00E6B8) : const Color(0xFFE11D48),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tracking Service Active:',
                      style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                    ),
                    Row(
                      children: [
                        Icon(
                          isTrackingActive ? Icons.play_circle_filled_rounded : Icons.stop_circle_rounded,
                          color: isTrackingActive ? const Color(0xFF00E6B8) : const Color(0xFF94A3B8),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isTrackingActive ? 'Yes' : 'No',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isTrackingActive ? const Color(0xFF00E6B8) : const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: (isTrackingActive || _isToggling)
                            ? null
                            : () async {
                                setState(() => _isToggling = true);
                                try {
                                  final prefs = await SharedPreferences.getInstance();
                                  final consentAccepted = prefs.getBool('consent_accepted') ?? false;
                                  const platform = MethodChannel('com.shoption.calltracker/tracking');
                                  final bool hasNativePerms = await platform.invokeMethod('hasCallPermissions');

                                  if (!consentAccepted || !hasNativePerms) {
                                    debugPrint('[START TRACKING CLICK] Consent/Perm check failed: consentAccepted=$consentAccepted, nativePerms=$hasNativePerms. Launching Disclosure Screen...');
                                    if (!mounted) return;
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => PermissionDisclosureScreen(
                                          onAccept: () async {
                                            debugPrint('[START TRACKING DISCLOSURE] Prominent Disclosure Accepted. Requesting native permissions...');
                                            Navigator.of(context).pop();
                                            final prefs = await SharedPreferences.getInstance();
                                            await prefs.setBool('consent_accepted', true);
                                            await prefs.setBool('tracking_toggled_active', true);
                                            try {
                                              const platform = MethodChannel('com.shoption.calltracker/tracking');
                                              final bool requested = await platform.invokeMethod('requestRequiredPermissions');
                                              debugPrint('[START TRACKING DISCLOSURE] Native request complete: $requested. Invoking ensureTracking...');
                                              final bool running = await platform.invokeMethod('ensureTracking');
                                              debugPrint('[START TRACKING DISCLOSURE] ensureTracking outcome: $running');
                                              try {
                                                await ApiService.updateMyTrackingActive(true);
                                              } catch (err) {
                                                debugPrint('[START TRACKING DISCLOSURE API ERR] $err');
                                              }
                                              await _checkTrackingStatus();
                                              await _loadUserData();
                                            } catch (e) {
                                              debugPrint('[START TRACKING DISCLOSURE EXCEPTION] $e');
                                            } finally {
                                              if (mounted) setState(() => _isToggling = false);
                                            }
                                          },
                                          onDeny: () {
                                            debugPrint('[START TRACKING DISCLOSURE] Denied.');
                                            Navigator.of(context).pop();
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('Tracking cannot be enabled without required permissions.'),
                                                backgroundColor: Colors.redAccent,
                                              ),
                                            );
                                            if (mounted) setState(() => _isToggling = false);
                                          },
                                        ),
                                      ),
                                    );
                                  } else {
                                    try {
                                      debugPrint('[START TRACKING CLICK] Perms already granted. Invoking ensureTracking directly...');
                                      final prefs = await SharedPreferences.getInstance();
                                      await prefs.setBool('tracking_toggled_active', true);
                                      final bool running = await platform.invokeMethod('ensureTracking');
                                      debugPrint('[START TRACKING CLICK] ensureTracking outcome: $running');
                                      try {
                                        await ApiService.updateMyTrackingActive(true);
                                      } catch (_) {}
                                      await _checkTrackingStatus();
                                      await _loadUserData();
                                    } catch (e) {
                                      debugPrint('[START TRACKING CLICK EXCEPTION] $e');
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Failed to start tracking: $e'), backgroundColor: Colors.redAccent),
                                      );
                                    } finally {
                                      if (mounted) setState(() => _isToggling = false);
                                    }
                                  }
                                } catch (e) {
                                  if (mounted) setState(() => _isToggling = false);
                                }
                              },
                        icon: const Icon(Icons.play_arrow, size: 18),
                        label: const Text('Start Tracking'),
                        style: ElevatedButton.styleFrom(
                          foregroundColor: Colors.white,
                          backgroundColor: const Color(0xFF1F8FFF),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: (!isTrackingActive || _isToggling)
                            ? null
                            : () async {
                                setState(() => _isToggling = true);
                                try {
                                  final prefs = await SharedPreferences.getInstance();
                                  await prefs.setBool('tracking_toggled_active', false);
                                  const platform = MethodChannel('com.shoption.calltracker/tracking');
                                  await platform.invokeMethod('stopTracking');
                                  try {
                                    await ApiService.updateMyTrackingActive(false);
                                  } catch (_) {}
                                  await _checkTrackingStatus();
                                  await _loadUserData();
                                } catch (e) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Failed to stop tracking: $e'), backgroundColor: Colors.redAccent),
                                  );
                                } finally {
                                  if (mounted) setState(() => _isToggling = false);
                                }
                              },
                        icon: const Icon(Icons.stop, size: 18),
                        label: const Text('Stop Tracking'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFE11D48),
                          side: BorderSide(color: isTrackingActive ? const Color(0xFFE11D48) : const Color(0xFF1E293B)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Total Talk Time & Total Logs header card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF1F8FFF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F8FFF).withOpacity(0.2)),
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined, color: Color(0xFF1F8FFF)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Talk Time',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _azureStats != null
                              ? _formatDuration(_azureStats!['total_duration_seconds'] as int? ?? 0)
                              : _formatDuration(_totalDuration),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                        ),
                      ],
                    ),
                  ),
                  const VerticalDivider(width: 20, thickness: 1.5, color: Color(0xFF1E293B)),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Total Logs',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _azureStats != null
                            ? '${_azureStats!['total_calls'] ?? 0}'
                            : '${_incomingCount + _outgoingCount}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF00E6B8)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Incoming / Outgoing Panels
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0E1528),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.call_received, color: Color(0xFF1F8FFF), size: 16),
                          SizedBox(width: 6),
                          Text(
                            'Incoming',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _azureStats != null
                            ? 'Total: ${_azureStats!['incoming_count']}'
                            : 'Total Calls: $_incomingCount',
                        style: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0E1528),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.call_made, color: Color(0xFF00E6B8), size: 16),
                          SizedBox(width: 6),
                          Text(
                            'Outgoing',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _azureStats != null
                            ? 'Total: ${_azureStats!['outgoing_count']}'
                            : 'Total Calls: $_outgoingCount',
                        style: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Advanced Analytics Row
          if (_azureStats != null)
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E1528),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.av_timer_rounded, color: Color(0xFF1F8FFF), size: 18),
                        const SizedBox(height: 4),
                        const Text('Avg Duration', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          '${_azureStats!['avg_duration_seconds'] ?? 0.0}s',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E1528),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF00E6B8), size: 18),
                        const SizedBox(height: 4),
                        const Text('Success Rate', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          '${_azureStats!['success_rate'] ?? 0.0}%',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E1528),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.access_time_filled_rounded, color: Colors.amber, size: 18),
                        const SizedBox(height: 4),
                        const Text('Peak Hour', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          '${_azureStats!['peak_hour'] ?? 'N/A'}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          // Weekly trend visualization chart
          _buildWeeklyTrendChart(),
        ],
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Color(0xFF1F8FFF), fontSize: 16)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyTrendChart() {
    if (_azureStats == null) {
      return const SizedBox.shrink();
    }
    
    final List<dynamic> trends = _azureStats!['daily_trends'] ?? [];
    if (trends.isEmpty) return const SizedBox.shrink();
    
    // Find max duration to scale the bars
    int maxDuration = 1;
    for (final t in trends) {
      final dur = (t['duration_seconds'] as num? ?? 0).toInt();
      if (dur > maxDuration) maxDuration = dur;
    }
    
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Weekly Performance Trend',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F8FFF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.cloud_done_outlined, size: 10, color: Color(0xFF1F8FFF)),
                    SizedBox(width: 4),
                    Text(
                      'Cloud Sync',
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF1F8FFF)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: trends.map<Widget>((t) {
                final day = (t['day'] ?? '').toString();
                final dur = (t['duration_seconds'] as num? ?? 0).toInt();
                final double ratio = dur / maxDuration;
                final double height = (ratio * 70).clamp(5, 70);
                
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Tooltip(
                        message: _formatDuration(dur),
                        child: Container(
                          width: 14,
                          height: height,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF1F8FFF), Color(0xFF00E6B8)],
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                            ),
                            borderRadius: BorderRadius.circular(4),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF1F8FFF).withOpacity(0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        day,
                        style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF050816),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF1F8FFF)),
        ),
      );
    }

    Widget content;
    String screenTitle = 'Call Tracker';
    String screenSubtitle = 'System Console';

    switch (_activeRoute) {
      case 'tracking':
        content = const WarriorHomeScreen();
        screenTitle = 'My Tracking';
        screenSubtitle = 'Personal Call History';
        break;
      case 'reports':
        content = const ReportsScreen();
        screenTitle = 'Reports & Stats';
        screenSubtitle = 'Team call summaries';
        break;
      case 'approvals':
        content = const PendingUsersScreen();
        screenTitle = 'Approvals';
        screenSubtitle = 'Approve pending warriors';
        break;
      case 'employees':
        content = const OrgEmployeesScreen();
        screenTitle = 'Employee Registry';
        screenSubtitle = 'Registry records';
        break;
      case 'management':
        content = const WarriorManagementScreen();
        screenTitle = 'User Management';
        screenSubtitle = 'Edit roles & reassign';
        break;
      case 'profile':
        content = const ProfileScreen();
        screenTitle = 'My Profile';
        screenSubtitle = 'User details';
        break;
      case 'dashboard':
      default:
        content = RefreshIndicator(
          color: const Color(0xFF1F8FFF),
          backgroundColor: const Color(0xFF1E293B),
          onRefresh: () async {
            await _syncCallLogs();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: _buildWelcomeContent(),
          ),
        );
        screenTitle = 'LeadLens Console';
        screenSubtitle = 'Management Dashboard';
        break;
    }

    // Wrap the respective screen inside a Scaffold with the custom Drawer and ShoptionAppBar
    return Scaffold(
      backgroundColor: const Color(0xFF050816),
      appBar: ShoptionAppBar(
        title: screenTitle,
        subtitle: screenSubtitle,
        userInitials: _userName,
        onProfilePressed: () {
          setState(() {
            _activeRoute = 'profile';
          });
        },
      ),
      drawer: _buildDrawer(),
      body: content,
    );
  }
}
