import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sqflite/sqflite.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class WarriorHomeScreen extends StatefulWidget {
  const WarriorHomeScreen({super.key});

  @override
  State<WarriorHomeScreen> createState() => _WarriorHomeScreenState();
}

class _WarriorHomeScreenState extends State<WarriorHomeScreen> with WidgetsBindingObserver {
  static const platform = MethodChannel('com.shoption.calltracker/tracking');

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
    _bootstrap();
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
    await _loadUserInfo();
    await _initializeDatabase();
    await _loadCallLogs();
    // Always ensure the tracking service is running on startup.
    await _ensureTracking();
    await _restoreFromBackend();
    await _syncCallLogs();
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
              'user_id': userId,
            },
            conflictAlgorithm: ConflictAlgorithm.ignore,
          );
        }
      });
      await _loadCallLogs();
    } catch (e) {
      debugPrint('⚠️ Local restore skipped (will sync on next check): $e');
    }
  }

  Future<void> _initializeDatabase() async {
    final databasePath = await getDatabasesPath();
    final path = '${databasePath}/call_tracker.db';

    database = await openDatabase(
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
  }

  Future<void> _loadCallLogs() async {
    if (database == null) return;
    final List<Map<String, dynamic>> maps = await database!.query(
      'call_logs',
      where: 'user_id = ?',
      whereArgs: [userId],
      orderBy: 'timestamp DESC',
    );
    setState(() {
      callLogs = maps;
    });
  }

  Future<void> _ensureTracking() async {
    try {
      final bool trackingRunning = await platform.invokeMethod('ensureTracking');
      debugPrint('Service status ensured: $trackingRunning');
    } catch (e) {
      debugPrint('Failed to communicate with service: $e');
    }
  }

  void _setupMethodChannelListener() {
    platform.setMethodCallHandler((call) async {
      if (call.method == 'onNewCallLogged') {
        debugPrint('🔔 Native call logged! Reloading local logs...');
        await _loadCallLogs();
        await _syncCallLogs();
      }
    });
  }

  Future<void> _requestPermissions() async {
    // We request permissions via the custom method channel to orchestrate service start properly
    try {
      final bool granted = await platform.invokeMethod('requestRequiredPermissions');
      debugPrint('Required permissions granted status: $granted');
      if (granted) {
        await _ensureTracking();
      }
    } catch (e) {
      debugPrint('Permission request error: $e');
    }
  }

  Future<void> _syncCallLogs() async {
    if (database == null || isSyncing) return;
    setState(() {
      isSyncing = true;
    });

    try {
      // Find all unsynced logs for active user
      final List<Map<String, dynamic>> unsynced = await database!.query(
        'call_logs',
        where: 'is_synced = 0 AND user_id = ?',
        whereArgs: [userId],
      );

      if (unsynced.isNotEmpty) {
        try {
          // Prepare the payload as a list of log maps for the bulk syncCalls endpoint
          final payload = unsynced.map((log) => {
            'phone_number': log['phone_number'] ?? 'Unknown',
            'call_type': log['call_type'] ?? 'Unknown',
            'duration_seconds': (log['duration_seconds'] as num? ?? 0).toInt(),
            'timestamp': log['timestamp'] ?? 'Unknown',
            'system_call_id': log['system_call_id'] ?? '',
          }).toList();

          await ApiService.syncCalls(payload);

          // Mark all as synced locally
          await database!.transaction((txn) async {
            for (final log in unsynced) {
              await txn.update(
                'call_logs',
                {'is_synced': 1},
                where: 'id = ?',
                whereArgs: [log['id']],
              );
            }
          });
        } catch (e) {
          debugPrint('Failed to sync batch: $e');
        }
      }
    } catch (e) {
      debugPrint('Sync error: $e');
    } finally {
      await _loadCallLogs();
      setState(() {
        isSyncing = false;
      });
    }
  }

  Future<void> _handleManualRefresh() async {
    await _syncCallLogs();
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadCallLogs();
      _syncCallLogs();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
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

  @override
  Widget build(BuildContext context) {
    int totalIncoming = 0;
    int totalOutgoing = 0;
    int attendedIncoming = 0;
    int missedIncoming = 0;
    int connectedOutgoing = 0;
    int dialedOutgoing = 0;

    int totalIncomingSeconds = 0;
    int totalOutgoingSeconds = 0;

    int syncedCalls = 0;
    int unsyncedCalls = 0;

    for (final log in callLogs) {
      final type = (log['call_type'] ?? '').toString().toLowerCase();
      final duration = (log['duration_seconds'] as num? ?? 0).toInt();
      final isSynced = log['is_synced'] == 1;

      if (isSynced) {
        syncedCalls++;
      } else {
        unsyncedCalls++;
      }

      if (type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked') {
        totalIncoming++;
        if (duration > 0 && type == 'incoming') {
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
            icon: isSyncing 
                ? const SizedBox(
                    width: 20, 
                    height: 20, 
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF04693F))
                  )
                : const Icon(Icons.refresh, color: Color(0xFF04693F)),
            onPressed: isSyncing ? null : _handleManualRefresh,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF04693F)),
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
                // Always-on tracking indicator (read-only status badge)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F3EC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF04693F).withOpacity(0.2), width: 1.5),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.spatial_audio_off_rounded, color: Color(0xFF04693F), size: 20),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Call Tracking Active',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF04693F)),
                        ),
                      ),
                      Icon(Icons.check_circle_rounded, color: Color(0xFF04693F), size: 18),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Talk Time header card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF04693F).withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF04693F).withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined, color: Color(0xFF04693F)),
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
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF010B26)),
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
                                Icon(Icons.call_received_rounded, size: 16, color: Color(0xFF04693F)),
                                SizedBox(width: 6),
                                Text(
                                  'Incoming',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
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
                                Icon(Icons.call_made_rounded, size: 16, color: Color(0xFF04693F)),
                                SizedBox(width: 6),
                                Text(
                                  'Outgoing',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
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
                      const Icon(Icons.sync_problem_outlined, size: 14, color: Color(0xFF04693F))
                    else
                      const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFF04693F)),
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
                    color: const Color(0xFF04693F),
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
                            categoryColor = const Color(0xFFD32F2F); // Red
                            iconData = Icons.call_missed_rounded;
                          } else {
                            categoryLabel = 'Incoming (Attended)';
                            categoryColor = const Color(0xFF04693F); // Brand Green
                            iconData = Icons.call_received_rounded;
                          }
                        } else {
                          if (isDialed) {
                            categoryLabel = 'Dialed (Unconnected)';
                            categoryColor = const Color(0xFFE65100); // Amber/Orange
                            iconData = Icons.call_missed_outgoing_rounded;
                          } else {
                            categoryLabel = 'Outgoing (Connected)';
                            categoryColor = const Color(0xFF010B26); // Brand Navy
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
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
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
                              color: isSynced ? const Color(0xFF04693F) : const Color(0xFF010B26),
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
