import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sqflite/sqflite.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class WarriorHomeScreen extends StatefulWidget {
  const WarriorHomeScreen({super.key});

  @override
  State<WarriorHomeScreen> createState() => _WarriorHomeScreenState();
}

class _WarriorHomeScreenState extends State<WarriorHomeScreen> with WidgetsBindingObserver {
  static const platform = MethodChannel('com.example.calltracker/tracking');

  bool isTracking = false;
  bool isSyncing = false;
  List<Map<String, dynamic>> callLogs = [];
  Database? database;
  String userName = 'Warrior';
  String userEmail = '';
  String userId = '';


  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadUserInfo();
    _bootstrap();
    _checkTrackingStatus();
    _setupMethodChannelListener();
    _requestPermissions();
  }

  Future<void> _loadUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      userName = prefs.getString('user_name') ?? 'Warrior';
      userEmail = prefs.getString('user_email') ?? '';
      userId = prefs.getString('user_id') ?? '';
    });
  }

  Future<void> _bootstrap() async {
    await _initializeDatabase();
    await _loadCallLogs();
    await _syncCallLogs();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadCallLogs().then((_) => _syncCallLogs());
      _checkTrackingStatus();
    }
  }

  void _setupMethodChannelListener() {
    platform.setMethodCallHandler((call) async {
      if (call.method == 'callRecorded') {
        await _loadCallLogs();
        await _syncCallLogs();
        setState(() {});
      }
      return null;
    });
  }

  Future<void> _requestPermissions() async {
    try {
      await platform.invokeMethod<bool>('requestRequiredPermissions');
    } catch (e) {
      debugPrint('MethodChannel requestRequiredPermissions is not supported on this platform: $e');
    }
    try {
      await Permission.notification.request();
    } catch (e) {
      debugPrint('Permission handler is not supported on this platform: $e');
    }
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _initializeDatabase() async {
    try {
      final databasesPath = await getDatabasesPath();
      final path = '$databasesPath/call_tracker.db';
      database = await openDatabase(
        path,
        version: 3,
        onCreate: (db, version) async {
          await db.execute('''
            CREATE TABLE call_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              phone_number TEXT,
              call_type TEXT,
              timestamp TEXT,
              duration_seconds INTEGER,
              system_call_id TEXT UNIQUE,
              is_synced INTEGER DEFAULT 0
            )
          ''');
        },
        onUpgrade: (db, oldVersion, newVersion) async {
          if (oldVersion < 2) {
            await db.execute('ALTER TABLE call_logs ADD COLUMN system_call_id TEXT');
            await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_system_call_id ON call_logs(system_call_id)');
          }
          if (oldVersion < 3) {
            await db.execute('ALTER TABLE call_logs ADD COLUMN is_synced INTEGER DEFAULT 0');
          }
        },
      );
    } catch (e) {
      _showSnack('Error initializing database: $e');
    }
  }

  Future<void> _loadCallLogs() async {
    if (database == null) return;
    try {
      final logs = await database!.query(
        'call_logs',
        orderBy: 'timestamp DESC',
      );
      if (mounted) {
        setState(() {
          callLogs = logs;
        });
      }
    } catch (e) {
      _showSnack('Error loading call logs: $e');
    }
  }

  Future<void> _syncCallLogs() async {
    if (isSyncing || database == null) return;

    setState(() {
      isSyncing = true;
    });

    try {
      final List<Map<String, dynamic>> unsyncedLogs = await database!.query(
        'call_logs',
        where: 'is_synced = ?',
        whereArgs: [0],
      );

      if (unsyncedLogs.isEmpty) {
        setState(() {
          isSyncing = false;
        });
        return;
      }

      final mappedLogs = unsyncedLogs.map((log) {
        return {
          'user_id': userId.isNotEmpty ? userId : null,
          'phone_number': log['phone_number'] ?? 'Unknown',
          'call_type': log['call_type'] ?? 'Unknown',
          'duration_seconds': log['duration_seconds'] ?? 0,
          'timestamp': log['timestamp'] ?? 'Unknown',
          'system_call_id': log['system_call_id'] ?? log['id'].toString(),
        };
      }).toList();

      // 1. Sync to Supabase directly (existing logic)
      bool supabaseSuccess = false;
      try {
        Supabase.instance.client;
        await Supabase.instance.client
            .from('call_logs')
            .upsert(mappedLogs, onConflict: 'system_call_id');
        supabaseSuccess = true;
      } catch (e) {
        debugPrint("Supabase direct sync error: $e");
      }

      // 2. Sync to FastAPI Server (new logic)
      bool serverSuccess = false;
      try {
        await ApiService.syncCalls(mappedLogs);
        serverSuccess = true;
      } catch (e) {
        debugPrint("FastAPI server sync error: $e");
      }

      // If either sync succeeded, mark as synced locally
      if (supabaseSuccess || serverSuccess) {
        for (final log in unsyncedLogs) {
          await database!.update(
            'call_logs',
            {'is_synced': 1},
            where: 'id = ?',
            whereArgs: [log['id']],
          );
        }
        await _loadCallLogs();
        _showSnack('Synced ${unsyncedLogs.length} logs successfully!');
      } else {
        _showSnack('Sync failed: Both destinations unreachable.');
      }
    } catch (e) {
      debugPrint("Error syncing call logs: $e");
      _showSnack('Sync failed: $e');
    } finally {
      if (mounted) {
        setState(() {
          isSyncing = false;
        });
      }
    }
  }

  Future<void> _checkTrackingStatus() async {
    try {
      final result = await platform.invokeMethod<bool>('getTrackingStatus');
      if (mounted) {
        setState(() {
          isTracking = result ?? false;
        });
      }
    } catch (_) {}
  }

  Future<void> _startTracking() async {
    try {
      final granted = await platform.invokeMethod<bool>('requestRequiredPermissions') ?? false;
      await Permission.notification.request();

      if (!granted) {
        _showSnack('Required permissions not granted');
        return;
      }

      await platform.invokeMethod('startTracking');
      if (mounted) {
        setState(() {
          isTracking = true;
        });
        _showSnack('Call tracking started');
      }
    } catch (e) {
      _showSnack('Error starting tracking: $e');
    }
  }

  Future<void> _stopTracking() async {
    try {
      await platform.invokeMethod('stopTracking');
      if (mounted) {
        setState(() {
          isTracking = false;
        });
        _showSnack('Call tracking stopped');
      }
    } catch (e) {
      _showSnack('Error stopping tracking: $e');
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }

  Future<void> _handleLogout() async {
    final confirmed = await _confirmLogout();
    if (!confirmed) return;
    await ApiService.logout();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  Future<bool> _confirmLogout() async {
    return await showDialog<bool>(
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
        ) ??
        false;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    database?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final totalCalls = callLogs.length;
    final syncedCalls = callLogs.where((log) => log['is_synced'] == 1).length;
    final unsyncedCalls = callLogs.where((log) => log['is_synced'] != 1).length;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ShoptionAppBar(
        title: userName,
        subtitle: 'Warrior Dashboard',
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header section
          Container(
            padding: const EdgeInsets.all(20.0),
            color: Colors.white,
            child: Column(
              children: [
                // Call tracking status switch card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: isTracking ? const Color(0xFFEBF2EC) : const Color(0xFFF9F9F9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isTracking ? const Color(0xFF2F5C36).withOpacity(0.2) : const Color(0xFFEEEEEE),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isTracking ? const Color(0xFF2F5C36) : const Color(0xFFE5E5E5),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isTracking ? Icons.spatial_audio_off_rounded : Icons.spatial_audio_rounded,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isTracking ? 'Tracking Active' : 'Tracking Inactive',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isTracking ? const Color(0xFF2F5C36) : const Color(0xFF111111),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isTracking ? 'Logging device call events...' : 'Start tracking to log calls.',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: isTracking,
                        activeColor: const Color(0xFF2F5C36),
                        onChanged: (val) {
                          if (val) {
                            _startTracking();
                          } else {
                            _stopTracking();
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Analytics statistics widgets
                Row(
                  children: [
                    Expanded(
                      child: _buildStatWidget(
                        'Total Logged',
                        totalCalls.toString(),
                        Icons.phone_iphone_rounded,
                        const Color(0xFF111111),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatWidget(
                        'Synced',
                        syncedCalls.toString(),
                        Icons.cloud_done_outlined,
                        Colors.green,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatWidget(
                        'Unsynced',
                        unsyncedCalls.toString(),
                        Icons.sync_problem_outlined,
                        unsyncedCalls > 0 ? const Color(0xFF2F5C36) : const Color(0xFF666666),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFEEEEEE)),
          // Call logs list view
          Expanded(
            child: callLogs.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.call_end_rounded, size: 48, color: Color(0xFFCCCCCC)),
                        SizedBox(height: 12),
                        Text(
                          'No call logs detected',
                          style: TextStyle(fontSize: 16, color: Color(0xFF888888)),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _syncCallLogs,
                    color: const Color(0xFF2F5C36),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: callLogs.length,
                      itemBuilder: (context, index) {
                        final log = callLogs[index];
                        final isIncoming = log['call_type'] == 'INCOMING';
                        final isSynced = log['is_synced'] == 1;
 
                        return Card(
                          color: const Color(0xFFF9F9F9),
                          elevation: 0,
                          margin: const EdgeInsets.only(bottom: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFFEEEEEE)),
                          ),
                          child: ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isIncoming ? Colors.green.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isIncoming ? Icons.call_received_rounded : Icons.call_made_rounded,
                                color: isIncoming ? Colors.green : Colors.blue,
                                size: 18,
                              ),
                            ),
                            title: Text(
                              log['phone_number'] ?? 'Unknown',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(
                                  log['timestamp'] ?? '',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF888888)),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Duration: ${log['duration_seconds']}s',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                                ),
                              ],
                            ),
                            trailing: Icon(
                              isSynced ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
                              color: isSynced ? Colors.green : const Color(0xFF2F5C36),
                              size: 20,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatWidget(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF888888)),
              ),
              Icon(icon, size: 12, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF111111)),
          ),
        ],
      ),
    );
  }
}
