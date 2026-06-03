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
    await _restoreFromBackend();
    await _syncCallLogs();
    await _syncTrackingStatus();
  }

  Future<void> _restoreFromBackend() async {
    if (database == null) return;
    try {
      final List<dynamic> serverLogs = await ApiService.getMyCallLogs();
      debugPrint('📥 Received ${serverLogs.length} call logs from server for restore');
      
      await database!.transaction((txn) async {
        for (final log in serverLogs) {
          final entry = Map<String, dynamic>.from(log as Map);
          final systemCallId = entry['system_call_id']?.toString();
          if (systemCallId == null) continue;
          
          await txn.insert(
            'call_logs',
            {
              'phone_number': entry['phone_number'] ?? 'Unknown',
              'call_type': entry['call_type'] ?? 'Unknown',
              'duration_seconds': entry['duration_seconds'] ?? 0,
              'timestamp': entry['timestamp'] ?? 'Unknown',
              'system_call_id': systemCallId,
              'is_synced': 1, // Already synced
            },
            conflictAlgorithm: ConflictAlgorithm.ignore,
          );
        }
      });
      await _loadCallLogs();
    } catch (e) {
      debugPrint('❌ Error restoring logs from backend: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadCallLogs().then((_) => _syncCallLogs());
      _syncTrackingStatus();
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

  Future<void> _syncTrackingStatus() async {
    try {
      final user = await ApiService.getMe();
      final remoteTrackingEnabled = user['is_tracking_enabled'] as bool? ?? true;
      final localStatus = await platform.invokeMethod<bool>('getTrackingStatus') ?? false;
      
      if (remoteTrackingEnabled && !localStatus) {
        await _startTracking();
      } else if (!remoteTrackingEnabled && localStatus) {
        await _stopTracking();
      } else {
        if (mounted) {
          setState(() {
            isTracking = localStatus;
          });
        }
      }
    } catch (e) {
      debugPrint('Error syncing tracking status with server: $e');
    }
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
                  backgroundColor: const Color(0xFF2F5C36),
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

  String _formatDuration(num seconds) {
    final int secs = seconds.toInt();
    final int h = secs ~/ 3600;
    final int m = (secs % 3600) ~/ 60;
    final int s = secs % 60;
    if (h > 0) {
      return '${h}h ${m}m ${s}s';
    } else if (m > 0) {
      return '${m}m ${s}s';
    }
    return '${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final syncedCalls = callLogs.where((log) => log['is_synced'] == 1).length;
    final unsyncedCalls = callLogs.where((log) => log['is_synced'] != 1).length;

    int totalIncoming = 0;
    int attendedIncoming = 0;
    int missedIncoming = 0;
    int totalOutgoing = 0;
    int connectedOutgoing = 0;
    int dialedOutgoing = 0;
    int totalIncomingSeconds = 0;
    int totalOutgoingSeconds = 0;

    for (final log in callLogs) {
      final type = (log['call_type'] ?? '').toString().toLowerCase();
      final duration = (log['duration_seconds'] as num? ?? 0).toInt();

      if (type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked') {
        totalIncoming++;
        if (type == 'incoming' && duration > 0) {
          attendedIncoming++;
          totalIncomingSeconds += duration;
        } else {
          missedIncoming++;
        }
      } else if (type == 'outgoing') {
        totalOutgoing++;
        if (duration > 0) {
          connectedOutgoing++;
          totalOutgoingSeconds += duration;
        } else {
          dialedOutgoing++;
        }
      }
    }
    final totalDurationSeconds = totalIncomingSeconds + totalOutgoingSeconds;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ShoptionAppBar(
        title: userName,
        subtitle: 'Warrior Dashboard',
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF2F5C36)),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header section
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Column(
              children: [
                // Call tracking status switch card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isTracking ? const Color(0xFFEBF2EC) : const Color(0xFFF9F9F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isTracking ? const Color(0xFF2F5C36).withOpacity(0.2) : const Color(0xFFEEEEEE),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isTracking ? const Color(0xFF2F5C36) : const Color(0xFFE5E5E5),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isTracking ? Icons.spatial_audio_off_rounded : Icons.spatial_audio_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isTracking ? 'Tracking Active' : 'Tracking Inactive',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: isTracking ? const Color(0xFF2F5C36) : const Color(0xFF111111),
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Managed by Group Leader',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: isTracking,
                        activeColor: const Color(0xFF2F5C36),
                        onChanged: null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Talk Time header card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2F5C36).withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF2F5C36).withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined, color: Color(0xFF2F5C36)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Total Talk Time (Incoming + Outgoing)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _formatDuration(totalDurationSeconds),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF111111)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Incoming and Outgoing breakdown row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9F9F9),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFEEEEEE)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.call_received_rounded, size: 16, color: Colors.green),
                                SizedBox(width: 6),
                                Text(
                                  'Incoming',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Attended: $attendedIncoming', style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                            const SizedBox(height: 4),
                            Text('Missed: $missedIncoming', style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                            const SizedBox(height: 6),
                            Text('Duration: ${_formatDuration(totalIncomingSeconds)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9F9F9),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFEEEEEE)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.call_made_rounded, size: 16, color: Colors.blue),
                                SizedBox(width: 6),
                                Text(
                                  'Outgoing',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Connected: $connectedOutgoing', style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                            const SizedBox(height: 4),
                            Text('Dialed: $dialedOutgoing', style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                            const SizedBox(height: 6),
                            Text('Duration: ${_formatDuration(totalOutgoingSeconds)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Sync Status: $syncedCalls Synced • $unsyncedCalls Pending',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                    ),
                    if (unsyncedCalls > 0)
                      const Icon(Icons.sync_problem_outlined, size: 14, color: Color(0xFF2F5C36))
                    else
                      const Icon(Icons.check_circle_outline, size: 14, color: Colors.green),
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
                        final rawType = (log['call_type'] ?? '').toString().toLowerCase();
                        final duration = (log['duration_seconds'] as num? ?? 0).toInt();
                        final isSynced = log['is_synced'] == 1;

                        bool isIncoming = rawType == 'incoming' || rawType == 'missed' || rawType == 'rejected' || rawType == 'blocked';
                        bool isMissed = isIncoming && (rawType != 'incoming' || duration == 0);
                        bool isDialed = !isIncoming && (rawType == 'outgoing' && duration == 0);

                        String categoryLabel = '';
                        Color categoryColor = Colors.grey;
                        IconData iconData = Icons.call_end;

                        if (isIncoming) {
                          if (isMissed) {
                            categoryLabel = 'Missed Call';
                            categoryColor = Colors.redAccent;
                            iconData = Icons.call_missed_rounded;
                          } else {
                            categoryLabel = 'Incoming (Attended)';
                            categoryColor = Colors.green;
                            iconData = Icons.call_received_rounded;
                          }
                        } else {
                          if (isDialed) {
                            categoryLabel = 'Dialed (Unconnected)';
                            categoryColor = Colors.orange;
                            iconData = Icons.call_missed_outgoing_rounded;
                          } else {
                            categoryLabel = 'Outgoing (Connected)';
                            categoryColor = Colors.blue;
                            iconData = Icons.call_made_rounded;
                          }
                        }

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
                                color: categoryColor.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                iconData,
                                color: categoryColor,
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
                                  isMissed 
                                      ? 'Missed call from ${log['phone_number'] ?? ''} at ${log['timestamp'] ?? ''}'
                                      : isDialed
                                          ? 'Dialed ${log['phone_number'] ?? ''} at ${log['timestamp'] ?? ''}'
                                          : 'Timestamp: ${log['timestamp'] ?? ''}',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF888888)),
                                ),
                                if (!isMissed && !isDialed) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Duration: ${_formatDuration(duration)}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                                  ),
                                ],
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
}
