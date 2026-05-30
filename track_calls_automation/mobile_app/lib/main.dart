import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sqflite/sqflite.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shoption Call Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0F0C),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF34D399),
          surface: Color(0xFF121B16),
          background: Color(0xFF0A0F0C),
        ),
        useMaterial3: true,
      ),
      home: const CallTrackerHome(),
    );
  }
}

class CallTrackerHome extends StatefulWidget {
  const CallTrackerHome({super.key});

  @override
  State<CallTrackerHome> createState() => _CallTrackerHomeState();
}

class _CallTrackerHomeState extends State<CallTrackerHome>
    with WidgetsBindingObserver {
  static const platform = MethodChannel('com.example.calltracker/tracking');
  
  bool isTracking = false;
  bool isSyncing = false;
  List<Map<String, dynamic>> callLogs = [];
  Database? database;

  void _showError(String message) {
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final messenger = ScaffoldMessenger.maybeOf(context);
      messenger?.showSnackBar(SnackBar(content: Text(message)));
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _bootstrap();
    _checkTrackingStatus();
    _setupMethodChannelListener();
    _requestPermissions();
  }

  Future<void> _bootstrap() async {
    await _initializeDatabase();
    await _loadCallLogs();
    await _syncCallLogsWithSupabase();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadCallLogs().then((_) => _syncCallLogsWithSupabase());
      _checkTrackingStatus();
    }
  }

  void _setupMethodChannelListener() {
    platform.setMethodCallHandler((call) async {
      if (call.method == 'callRecorded') {
        // Refresh the call logs when a new call is recorded
        await _loadCallLogs();
        await _syncCallLogsWithSupabase();
        setState(() {});
      }
      return null;
    });
  }

  Future<void> _requestPermissions() async {
    await platform.invokeMethod<bool>('requestRequiredPermissions');
    await Permission.notification.request();
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
            await db.execute(
              'ALTER TABLE call_logs ADD COLUMN system_call_id TEXT',
            );
            await db.execute(
              'CREATE UNIQUE INDEX IF NOT EXISTS idx_system_call_id ON call_logs(system_call_id)',
            );
          }
          if (oldVersion < 3) {
            await db.execute(
              'ALTER TABLE call_logs ADD COLUMN is_synced INTEGER DEFAULT 0',
            );
          }
        },
      );
    } catch (e) {
      _showError('Error initializing database: $e');
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
      _showError('Error loading call logs: $e');
    }
  }

  Future<void> _syncCallLogsWithSupabase() async {
    if (isSyncing || database == null) return;

    try {
      Supabase.instance.client;
    } catch (_) {
      // Supabase is not initialized
      return;
    }

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

      final supabaseLogs = unsyncedLogs.map((log) {
        return {
          'phone_number': log['phone_number'] ?? 'Unknown',
          'call_type': log['call_type'] ?? 'Unknown',
          'duration_seconds': log['duration_seconds'] ?? 0,
          'timestamp': log['timestamp'] ?? 'Unknown',
          'system_call_id': log['system_call_id'] ?? log['id'].toString(),
        };
      }).toList();

      await Supabase.instance.client
          .from('call_logs')
          .upsert(supabaseLogs, onConflict: 'system_call_id');

      for (final log in unsyncedLogs) {
        await database!.update(
          'call_logs',
          {'is_synced': 1},
          where: 'id = ?',
          whereArgs: [log['id']],
        );
      }

      await _loadCallLogs();
      _showError('Synced ${unsyncedLogs.length} logs to Database');
    } catch (e) {
      debugPrint("Error syncing with Database: $e");
      _showError('Sync failed: $e');
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
    } catch (e) {
      // Method not available yet
    }
  }

  Future<void> _startTracking() async {
    try {
      final granted =
          await platform.invokeMethod<bool>('requestRequiredPermissions') ??
          false;
      await Permission.notification.request();

      if (!granted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Required permissions not granted')),
          );
        }
        return;
      }

      await platform.invokeMethod('startTracking');
      if (mounted) {
        setState(() {
          isTracking = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Call tracking started')),
        );
      }
    } catch (e) {
      _showError('Error starting tracking: $e');
    }
  }

  Future<void> _stopTracking() async {
    try {
      await platform.invokeMethod('stopTracking');
      if (mounted) {
        setState(() {
          isTracking = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Call tracking stopped')),
        );
      }
    } catch (e) {
      _showError('Error stopping tracking: $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    database?.close();
    super.dispose();
  }

  Widget _buildMetricTile(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF121B16),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.15),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey,
                ),
              ),
              Icon(icon, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalCalls = callLogs.length;
    final syncedCalls = callLogs.where((log) => log['is_synced'] == 1).length;
    final unsyncedCalls = callLogs.where((log) => log['is_synced'] != 1).length;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png',
              height: 38,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.phone_callback_rounded,
                color: Color(0xFF10B981),
                size: 28,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SHOPTION',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'CALL TRACKER',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF10B981),
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF121B16),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: IconButton(
              icon: isSyncing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Color(0xFF10B981),
                      ),
                    )
                  : const Icon(Icons.sync_rounded, color: Colors.white),
              onPressed: isSyncing ? null : _syncCallLogsWithSupabase,
              tooltip: 'Sync logs now',
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // Status Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isTracking
                        ? [const Color(0xFF132F20), const Color(0xFF121B16)]
                        : [const Color(0xFF2C2213), const Color(0xFF121B16)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isTracking
                        ? const Color(0xFF10B981).withOpacity(0.2)
                        : const Color(0xFFF59E0B).withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Pulsing status dot
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: isTracking ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: (isTracking ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isTracking ? 'Service Active' : 'Service Inactive',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                isTracking
                                    ? 'Monitoring SIM call state in background'
                                    : 'Call tracking is paused. Enable to start monitoring.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: isTracking ? null : _startTracking,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: Colors.white.withOpacity(0.05),
                              disabledForegroundColor: Colors.white.withOpacity(0.3),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'Start Tracking',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: isTracking ? _stopTracking : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFEF4444),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: Colors.white.withOpacity(0.05),
                              disabledForegroundColor: Colors.white.withOpacity(0.3),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'Stop Tracking',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Metrics Row
              Row(
                children: [
                  Expanded(child: _buildMetricTile('Total', totalCalls.toString(), Icons.call_rounded, const Color(0xFF60A5FA))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricTile('Synced', syncedCalls.toString(), Icons.cloud_done_rounded, const Color(0xFF34D399))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildMetricTile('Pending', unsyncedCalls.toString(), Icons.cloud_upload_rounded, const Color(0xFFFBBF24))),
                ],
              ),
              const SizedBox(height: 24),

              // History Header
              const Padding(
                padding: EdgeInsets.only(bottom: 12.0),
                child: Text(
                  'CALL LOGS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                    color: Colors.grey,
                  ),
                ),
              ),

              // Call logs list
              Expanded(
                child: callLogs.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.call_missed_outgoing_rounded, size: 48, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 12),
                            Text(
                              'No call records yet',
                              style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: const Color(0xFF10B981),
                        backgroundColor: const Color(0xFF121B16),
                        onRefresh: () async {
                          await _loadCallLogs();
                          await _syncCallLogsWithSupabase();
                        },
                        child: ListView.separated(
                          itemCount: callLogs.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final log = callLogs[index];
                            final isSynced = log['is_synced'] == 1;
                            final isIncoming = (log['call_type'] ?? '').toString().toLowerCase() == 'incoming';
                            final number = log['phone_number'] ?? 'Unknown';

                            return Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFF121B16),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.03),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Call direction indicator icon
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: isIncoming
                                          ? const Color(0xFF10B981).withOpacity(0.1)
                                          : const Color(0xFF60A5FA).withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isIncoming ? Icons.call_received_rounded : Icons.call_made_rounded,
                                      size: 18,
                                      color: isIncoming ? const Color(0xFF10B981) : const Color(0xFF60A5FA),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  // Call Details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          number,
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                            letterSpacing: 0.2,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Text(
                                              log['call_type'] ?? 'Unknown',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white.withOpacity(0.5),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              '•   ${log['duration_seconds'] ?? 0}s',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: Colors.white.withOpacity(0.5),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          log['timestamp'] ?? 'Unknown',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.white.withOpacity(0.35),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Sync Status Indicator
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: isSynced
                                          ? const Color(0xFF10B981).withOpacity(0.1)
                                          : const Color(0xFFFBBF24).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isSynced ? Icons.check_circle_outline_rounded : Icons.sync_problem_rounded,
                                          size: 12,
                                          color: isSynced ? const Color(0xFF34D399) : const Color(0xFFFBBF24),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          isSynced ? 'Synced' : 'Pending',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w700,
                                            color: isSynced ? const Color(0xFF34D399) : const Color(0xFFFBBF24),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

