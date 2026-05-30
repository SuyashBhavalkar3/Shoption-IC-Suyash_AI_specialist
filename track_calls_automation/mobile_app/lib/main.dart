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
      title: 'Call Tracker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
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
      _showError('Synced ${unsyncedLogs.length} logs to Supabase');
    } catch (e) {
      debugPrint("Error syncing with Supabase: $e");
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Call Tracker'),
        actions: [
          IconButton(
            icon: isSyncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.black,
                    ),
                  )
                : const Icon(Icons.sync),
            onPressed: isSyncing ? null : _syncCallLogsWithSupabase,
            tooltip: 'Sync with Supabase',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status
            Text(
              'Status: ${isTracking ? "Tracking Enabled" : "Tracking Disabled"}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _startTracking,
                    child: const Text('Start Tracking'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _stopTracking,
                    child: const Text('Stop Tracking'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Call logs header
            Text(
              'Call Records (${callLogs.length})',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),

            // Call logs list
            Expanded(
              child: callLogs.isEmpty
                  ? const Center(
                      child: Text('No call records yet'),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        await _loadCallLogs();
                        await _syncCallLogsWithSupabase();
                      },
                      child: ListView.builder(
                        itemCount: callLogs.length,
                        itemBuilder: (context, index) {
                          final log = callLogs[index];
                          final isSynced = log['is_synced'] == 1;
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        log['phone_number'] ?? 'Unknown',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Icon(
                                        isSynced ? Icons.cloud_done : Icons.cloud_upload,
                                        size: 16,
                                        color: isSynced ? Colors.green : Colors.orange,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    log['call_type'] ?? 'Unknown',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Duration: ${log['duration_seconds'] ?? 0} sec',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    log['timestamp'] ?? 'Unknown',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
