import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:sqflite/sqflite.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

import 'package:url_launcher/url_launcher.dart';
import 'permission_disclosure_screen.dart';

class WarriorHomeScreen extends StatefulWidget {
  const WarriorHomeScreen({super.key});

  @override
  State<WarriorHomeScreen> createState() => _WarriorHomeScreenState();
}

class _WarriorHomeScreenState extends State<WarriorHomeScreen> with WidgetsBindingObserver {
  static const platform = MethodChannel('com.shoption.calltracker/tracking');

  bool isSyncing = false;
  bool showOnlyUnresponded = false;
  List<Map<String, dynamic>> callLogs = [];
  Database? database;
  String userName = 'Employee';
  String userEmail = '';
  String userId = '';

  bool isTrackingActive = false;
  bool permissionsGranted = false;
  Timer? _statusPingTimer;

  // ── Date Filter ──
  // Selected preset: 'today', 'yesterday', '7days', '30days', 'custom', 'all'
  String _dateFilterPreset = 'all';
  DateTime? _filterStartDate;
  DateTime? _filterEndDate;
  bool _isExporting = false;

  // Azure cloud stats
  Map<String, dynamic>? _azureStats;
  bool _loadingAzureStats = false;

  // Infinite Scroll & Pagination fields
  final int _sqliteLimit = 100;
  bool _isFetchingMore = false;
  bool _hasMoreLogs = true;
  late ScrollController _scrollController;
  bool _showBackToTopButton = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        _loadNextBatch();
      }
      final offset = _scrollController.offset;
      if (offset > 400 && !_showBackToTopButton) {
        setState(() {
          _showBackToTopButton = true;
        });
      } else if (offset <= 400 && _showBackToTopButton) {
        setState(() {
          _showBackToTopButton = false;
        });
      }
    });
    WidgetsBinding.instance.addObserver(this);
    _bootstrap();
    _setupMethodChannelListener();
  }

  Future<void> _loadUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      userName = prefs.getString('user_name') ?? 'Employee';
      userEmail = prefs.getString('user_email') ?? '';
      userId = prefs.getString('user_id') ?? '';
    });
  }

  Future<void> _bootstrap() async {
    await _loadUserInfo();
    await _initializeDatabase();
    await _loadCallLogs();

    final prefs = await SharedPreferences.getInstance();
    final consentAccepted = prefs.getBool('consent_accepted') ?? false;
    if (!consentAccepted) {
      _showConsentDisclosureOnStartup();
      return;
    }

    await _checkTrackingStatus();
    await _restoreFromBackend();
    await _syncCallLogs();
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

  void _showConsentDisclosureOnStartup() {
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PermissionDisclosureScreen(
            onAccept: () async {
              Navigator.of(context).pop(); // Dismiss disclosure screen
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('consent_accepted', true);
              try {
                final bool granted = await platform.invokeMethod('requestRequiredPermissions');
                debugPrint('Required permissions granted status: $granted');
              } catch (e) {
                debugPrint('Permission request error: $e');
              }
              // Bootstrap normally now
              await _checkTrackingStatus();
              await _restoreFromBackend();
              await _syncCallLogs();
            },
            onDeny: () async {
              Navigator.of(context).pop(); // Dismiss disclosure screen
              await _handleLogout();
            },
          ),
        ),
      );
    });
  }

  Future<void> _restoreFromBackend() async {
    if (database == null) return;
    try {
      final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
      final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
      
      final List<dynamic> serverLogs = await ApiService.getMyCallLogs(
        limit: 100,
        offset: 0,
        startDate: startStr,
        endDate: endStr,
      );
      debugPrint('📥 Received ${serverLogs.length} call logs from server for restore (range: $startStr to $endStr)');
      
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
      debugPrint('⚠️ Local restore skipped: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to sync logs from server: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
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

    // One-time migration to reset sync status for any call logs that failed to sync previously due to the server ID collision bug
    final prefs = await SharedPreferences.getInstance();
    final resynced = prefs.getBool('resync_v1_done') ?? false;
    if (!resynced) {
      try {
        await database!.rawUpdate('UPDATE call_logs SET is_synced = 0');
        await prefs.setBool('resync_v1_done', true);
        debugPrint('🔄 One-time sync reset: Set all local call logs to unsynced for recovery.');
      } catch (e) {
        debugPrint('Failed to run one-time sync reset: $e');
      }
    }
  }

  Future<void> _loadCallLogs() async {
    if (database == null) return;
    _hasMoreLogs = true;
    final List<Map<String, dynamic>> maps = await database!.query(
      'call_logs',
      where: 'user_id = ?',
      whereArgs: [userId],
      orderBy: 'timestamp DESC',
      limit: _sqliteLimit,
      offset: 0,
    );
    setState(() {
      callLogs = maps;
    });
  }

  Future<void> _loadNextBatch() async {
    if (_isFetchingMore || !_hasMoreLogs || database == null) return;
    setState(() {
      _isFetchingMore = true;
    });
    try {
      final List<Map<String, dynamic>> newMaps = await database!.query(
        'call_logs',
        where: 'user_id = ?',
        whereArgs: [userId],
        orderBy: 'timestamp DESC',
        limit: _sqliteLimit,
        offset: callLogs.length,
      );
      
      if (newMaps.isEmpty) {
        final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
        final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
        
        final List<dynamic> serverLogs = await ApiService.getMyCallLogs(
          limit: _sqliteLimit,
          offset: callLogs.length,
          startDate: startStr,
          endDate: endStr,
        );
        if (serverLogs.isEmpty) {
          _hasMoreLogs = false;
        } else {
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
                  'is_synced': 1,
                  'user_id': userId,
                },
                conflictAlgorithm: ConflictAlgorithm.ignore,
              );
            }
          });
          final List<Map<String, dynamic>> reQueryMaps = await database!.query(
            'call_logs',
            where: 'user_id = ?',
            whereArgs: [userId],
            orderBy: 'timestamp DESC',
            limit: _sqliteLimit,
            offset: callLogs.length,
          );
          if (reQueryMaps.isEmpty) {
            _hasMoreLogs = false;
          } else {
            setState(() {
              callLogs = List.from(callLogs)..addAll(reQueryMaps);
            });
          }
        }
      } else {
        setState(() {
          callLogs = List.from(callLogs)..addAll(newMaps);
        });
      }
    } catch (e) {
      debugPrint('Error loading next batch of logs: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingMore = false;
        });
      }
    }
  }

  /// Returns a filtered copy of callLogs based on the active date filter.
  List<Map<String, dynamic>> get _filteredCallLogs {
    if (_dateFilterPreset == 'all' || (_filterStartDate == null && _filterEndDate == null)) {
      return callLogs;
    }
    return callLogs.where((log) {
      final ts = log['timestamp'] as String? ?? '';
      final dt = _parseCustomTimestamp(ts);
      if (dt == null) return false;
      final start = _filterStartDate;
      final end = _filterEndDate;
      if (start != null && dt.isBefore(start)) return false;
      if (end != null && dt.isAfter(end)) return false;
      return true;
    }).toList();
  }

  void _applyPreset(String preset) {
    final now = DateTime.now();
    setState(() {
      _dateFilterPreset = preset;
      switch (preset) {
        case 'today':
          _filterStartDate = DateTime(now.year, now.month, now.day);
          _filterEndDate = DateTime(now.year, now.month, now.day, 23, 59, 59);
          break;
        case 'yesterday':
          final y = now.subtract(const Duration(days: 1));
          _filterStartDate = DateTime(y.year, y.month, y.day);
          _filterEndDate = DateTime(y.year, y.month, y.day, 23, 59, 59);
          break;
        case '7days':
          _filterStartDate = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 6));
          _filterEndDate = DateTime(now.year, now.month, now.day, 23, 59, 59);
          break;
        case '30days':
          _filterStartDate = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 29));
          _filterEndDate = DateTime(now.year, now.month, now.day, 23, 59, 59);
          break;
        case 'all':
          _filterStartDate = null;
          _filterEndDate = null;
          break;
      }
    });
    _loadCallLogs();
    _restoreFromBackend();
  }

  Future<void> _pickCustomDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: now,
      initialDateRange: (_filterStartDate != null && _filterEndDate != null)
          ? DateTimeRange(start: _filterStartDate!, end: _filterEndDate!)
          : DateTimeRange(
              start: now.subtract(const Duration(days: 7)),
              end: now,
            ),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF1F8FFF),
              onPrimary: Colors.white,
              surface: Color(0xFF0E1528),
              onSurface: Color(0xFFF8FAFC),
            ),
            dialogBackgroundColor: const Color(0xFF0E1528),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dateFilterPreset = 'custom';
        _filterStartDate = picked.start;
        _filterEndDate = DateTime(picked.end.year, picked.end.month, picked.end.day, 23, 59, 59);
      });
      _loadCallLogs();
      _restoreFromBackend();
    }
  }

  String _filterLabel() {
    if (_dateFilterPreset == 'custom' && _filterStartDate != null && _filterEndDate != null) {
      final fmt = (DateTime d) => '${d.day}/${d.month}/${d.year}';
      return '${fmt(_filterStartDate!)} – ${fmt(_filterEndDate!)}';
    }
    return '';
  }

  Future<void> _exportCsv(List<Map<String, dynamic>> logs, String typeLabel) async {
    if (_isExporting) return;
    setState(() => _isExporting = true);
    try {
      final buffer = StringBuffer();
      buffer.writeln('Phone Number,Call Type,Duration (seconds),Timestamp,Synced');
      for (final log in logs) {
        final phone = (log['phone_number'] ?? '').toString().replaceAll(',', ' ');
        final type = (log['call_type'] ?? '').toString();
        final dur = (log['duration_seconds'] ?? 0).toString();
        final ts = (log['timestamp'] ?? '').toString().replaceAll(',', ' ');
        final synced = log['is_synced'] == 1 ? 'Yes' : 'No';
        buffer.writeln('$phone,$type,$dur,$ts,$synced');
      }

      final dir = await getTemporaryDirectory();
      final now = DateTime.now();
      final filename = '${typeLabel}_${now.year}${now.month.toString().padLeft(2,'0')}${now.day.toString().padLeft(2,'0')}.csv';
      final file = File('${dir.path}/$filename');
      await file.writeAsString(buffer.toString());

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'My Call Logs Export (${typeLabel}) – $filename',
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            backgroundColor: const Color(0xFFE11D48),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _checkTrackingStatus() async {
    try {
      final bool active = await platform.invokeMethod('isTrackingActive');
      final bool granted = await platform.invokeMethod('hasCallPermissions');
      setState(() {
        isTrackingActive = active;
        permissionsGranted = granted;
      });
    } catch (e) {
      debugPrint('Failed to check status: $e');
    }
  }

  Future<void> _startTracking() async {
    try {
      final bool trackingRunning = await platform.invokeMethod('ensureTracking');
      debugPrint('Service status ensured: $trackingRunning');
      if (trackingRunning) {
        try {
          await ApiService.updateMyTrackingActive(true);
        } catch (apiError) {
          debugPrint('Failed to sync active status to server: $apiError');
        }
      }
      await _checkTrackingStatus();
    } catch (e) {
      debugPrint('Failed to communicate with service: $e');
    }
  }

  Future<void> _stopTracking() async {
    try {
      final bool success = await platform.invokeMethod('stopTracking');
      debugPrint('Service stop status: $success');
      try {
        await ApiService.updateMyTrackingActive(false);
      } catch (apiError) {
        debugPrint('Failed to sync active status to server: $apiError');
      }
      await _checkTrackingStatus();
    } catch (e) {
      debugPrint('Failed to stop service: $e');
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
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PermissionDisclosureScreen(
          onAccept: () async {
            Navigator.of(context).pop(); // Dismiss disclosure screen
            try {
              final bool granted = await platform.invokeMethod('requestRequiredPermissions');
              debugPrint('Required permissions granted status: $granted');
              await _checkTrackingStatus();
            } catch (e) {
              debugPrint('Permission request error: $e');
            }
          },
          onDeny: () {
            Navigator.of(context).pop(); // Dismiss disclosure screen
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Tracking cannot be enabled without required permissions.'),
                backgroundColor: Colors.redAccent,
              ),
            );
          },
        ),
      ),
    );
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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Syncing ${unsynced.length} new calls to server...'),
              duration: const Duration(seconds: 2),
            ),
          );
        }
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
    } catch (e) {
      debugPrint('Sync error: $e');
    } finally {
      await _loadCallLogs();
      await _loadAzureStats();
      setState(() {
        isSyncing = false;
      });
    }
  }

  Future<void> _handleManualRefresh() async {
    await _syncCallLogs();
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
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
    _scrollController.dispose();
    _statusPingTimer?.cancel();
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

  DateTime? _parseCustomTimestamp(String ts) {
    try {
      final parts = ts.trim().split(' ');
      if (parts.length < 2) return null;
      final dateParts = parts[0].split('-');
      if (dateParts.length < 3) return null;
      final timeParts = parts[1].split(':');
      if (timeParts.length < 2) return null;

      final day = int.parse(dateParts[0]);
      final monthStr = dateParts[1].toLowerCase();
      final year = int.parse(dateParts[2]);

      final hour = int.parse(timeParts[0]);
      final minute = int.parse(timeParts[1]);

      const months = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };

      final month = months[monthStr];
      if (month == null) return null;

      return DateTime(year, month, day, hour, minute);
    } catch (e) {
      debugPrint('Error parsing timestamp $ts: $e');
      return null;
    }
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
    // Apply date filter to get the currently visible logs
    final visibleLogs = _filteredCallLogs;

    int attendedIncoming = 0;
    int missedIncoming = 0;
    int connectedOutgoing = 0;
    int dialedOutgoing = 0;

    int totalIncomingSeconds = 0;
    int totalOutgoingSeconds = 0;

    int syncedCalls = 0;
    int unsyncedCalls = 0;

    final List<Map<String, dynamic>> missedCalls = [];
    final List<Map<String, dynamic>> outgoingCalls = [];

    // Stats computed over ALL call logs (for unresponded logic which is always from full history)
    for (final log in callLogs) {
      final isSynced = log['is_synced'] == 1;
      if (isSynced) { syncedCalls++; } else { unsyncedCalls++; }

      final type = (log['call_type'] ?? '').toString().toLowerCase();
      final duration = (log['duration_seconds'] as num? ?? 0).toInt();
      final bool isIncomingLog = type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked';
      final bool isMissedLog = isIncomingLog && (type != 'incoming' || duration == 0);
      if (isMissedLog) missedCalls.add(log);
      else if (type == 'outgoing') outgoingCalls.add(log);
    }

    // Stats for the KPI cards use the FILTERED logs
    for (final log in visibleLogs) {
      final type = (log['call_type'] ?? '').toString().toLowerCase();
      final duration = (log['duration_seconds'] as num? ?? 0).toInt();

      final bool isIncoming = type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked';

      if (isIncoming) {
        if (duration > 0 && type == 'incoming') {
          attendedIncoming++;
          totalIncomingSeconds += duration;
        } else {
          missedIncoming++;
        }
      } else if (type == 'outgoing') {
        if (duration > 0) {
          connectedOutgoing++;
          totalOutgoingSeconds += duration;
        } else {
          dialedOutgoing++;
        }
      }
    }
    final totalDurationSeconds = totalIncomingSeconds + totalOutgoingSeconds;

    // Unresponded missed calls — always from FULL history (not date-filtered)
    final List<Map<String, dynamic>> unrespondedMissedCalls = [];
    final now = DateTime.now();
    for (final mc in missedCalls) {
      final phone = mc['phone_number'] ?? '';
      final timestampStr = mc['timestamp'] ?? '';
      final mcTime = _parseCustomTimestamp(timestampStr);
      if (mcTime == null) continue;

      bool responded = false;
      for (final oc in outgoingCalls) {
        if ((oc['phone_number'] ?? '') == phone) {
          final ocTime = _parseCustomTimestamp(oc['timestamp'] ?? '');
          if (ocTime != null && ocTime.isAfter(mcTime)) {
            responded = true;
            break;
          }
        }
      }

      if (!responded) {
        final difference = now.difference(mcTime);
        if (difference.inMinutes >= 60) {
          unrespondedMissedCalls.add(mc);
        }
      }
    }

    final Set<int> unrespondedMissedCallLocalIds = unrespondedMissedCalls
        .map((mc) => mc['id'] as int? ?? -1)
        .where((id) => id != -1)
        .toSet();

    final displayedLogs = showOnlyUnresponded
        ? visibleLogs
            .where((log) => unrespondedMissedCallLocalIds.contains(log['id'] as int? ?? -1))
            .toList()
        : visibleLogs;

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _syncCallLogs,
          color: const Color(0xFF1F8FFF),
          child: CustomScrollView(
            controller: _scrollController,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
              if (unrespondedMissedCalls.isNotEmpty)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF881337).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDA4AF).withOpacity(0.3), width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Color(0xFFE11D48), size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Unresponded Missed Call${unrespondedMissedCalls.length > 1 ? 's' : ''}",
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFFDA4AF),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "You have ${unrespondedMissedCalls.length} missed call${unrespondedMissedCalls.length > 1 ? 's' : ''} not responded for more than 60 minutes. Action required!",
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFFFDA4AF),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          // ── Date Filter Row ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Preset chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All Time', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Today', 'today'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Yesterday', 'yesterday'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Last 7 Days', '7days'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Last 30 Days', '30days'),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _pickCustomDateRange,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _dateFilterPreset == 'custom'
                                ? const Color(0xFF1F8FFF)
                                : const Color(0xFF0E1528),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _dateFilterPreset == 'custom'
                                  ? const Color(0xFF1F8FFF)
                                  : const Color(0xFF1E293B),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.date_range_rounded,
                                size: 13,
                                color: _dateFilterPreset == 'custom'
                                    ? Colors.white
                                    : const Color(0xFF94A3B8),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _dateFilterPreset == 'custom' && _filterLabel().isNotEmpty
                                    ? _filterLabel()
                                    : 'Custom Range',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: _dateFilterPreset == 'custom'
                                      ? Colors.white
                                      : const Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Export options
                const SizedBox(height: 12),
                const Text(
                  'EXPORT OPTIONS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F8FFF),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                // CSV Exports (Local)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _isExporting ? null : () => _exportCsv(visibleLogs, 'all_calls'),
                        icon: const Icon(Icons.download_rounded, size: 14, color: Color(0xFF00E6B8)),
                        label: Text(
                          'All CSV (${visibleLogs.length})',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF00E6B8)),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          side: const BorderSide(color: Color(0xFF00E6B8), width: 1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _isExporting ? null : () {
                          final missed = visibleLogs.where((log) {
                            final type = (log['call_type'] ?? '').toString().toLowerCase();
                            final duration = (log['duration_seconds'] as num? ?? 0).toInt();
                            final isIncoming = type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked';
                            return isIncoming && (type != 'incoming' || duration == 0);
                          }).toList();
                          _exportCsv(missed, 'missed_calls');
                        },
                        icon: const Icon(Icons.call_missed_rounded, size: 14, color: Color(0xFFE11D48)),
                        label: Text(
                          'Missed CSV (${visibleLogs.where((log) {
                            final type = (log['call_type'] ?? '').toString().toLowerCase();
                            final duration = (log['duration_seconds'] as num? ?? 0).toInt();
                            final isIncoming = type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked';
                            return isIncoming && (type != 'incoming' || duration == 0);
                          }).length})',
                          style: const TextStyle(fontSize: 11, color: Color(0xFFE11D48)),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          side: const BorderSide(color: Color(0xFFE11D48), width: 1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Server-side PDF/Excel Exports
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          try {
                            final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
                            final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
                            
                            final file = await ApiService.downloadReportAsFile(
                              format: 'excel',
                              warriorId: userId,
                              startDate: startStr,
                              endDate: endStr,
                            );
                            
                            await SharePlus.instance.share(
                              ShareParams(
                                files: [XFile(file.path)],
                                text: 'My Call Logs (Excel)',
                              ),
                            );
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Excel export failed: $e'), backgroundColor: Colors.redAccent),
                            );
                          }
                        },
                        icon: const Icon(Icons.grid_on_rounded, size: 14, color: Colors.white),
                        label: const Text('Export Excel', style: TextStyle(fontSize: 11, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1F8FFF),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          try {
                            final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
                            final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
                            
                            final file = await ApiService.downloadReportAsFile(
                              format: 'pdf',
                              warriorId: userId,
                              startDate: startStr,
                              endDate: endStr,
                            );
                            
                            await SharePlus.instance.share(
                              ShareParams(
                                files: [XFile(file.path)],
                                text: 'My Call Logs (PDF)',
                              ),
                            );
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('PDF export failed: $e'), backgroundColor: Colors.redAccent),
                            );
                          }
                        },
                        icon: const Icon(Icons.picture_as_pdf_rounded, size: 14, color: Colors.white),
                        label: const Text('Export PDF', style: TextStyle(fontSize: 11, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Header section
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.transparent,
            child: Column(
              children: [
                // Total Talk Time & Total Logs header card with beautiful gradient
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF334155).withOpacity(0.4), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: IntrinsicHeight(
                    child: Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: Color(0xFF3B82F6), size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'TOTAL TALK TIME',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF64748B), letterSpacing: 0.8),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _azureStats != null && _dateFilterPreset == 'all'
                                    ? _formatDuration(_azureStats!['total_duration_seconds'] as int? ?? 0)
                                    : _formatDuration(totalDurationSeconds),
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF8FAFC)),
                              ),
                            ],
                          ),
                        ),
                        const VerticalDivider(width: 20, thickness: 1.2, color: Color(0xFF334155)),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'TOTAL LOGS',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF64748B), letterSpacing: 0.8),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _azureStats != null && _dateFilterPreset == 'all'
                                  ? '${_azureStats!['total_calls'] ?? 0}'
                                  : '${visibleLogs.length}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Incoming and Outgoing breakdown row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF1F2937), width: 1.2),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.call_received_rounded, size: 16, color: Color(0xFF10B981)),
                                SizedBox(width: 6),
                                Text(
                                  'Incoming',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _azureStats != null && _dateFilterPreset == 'all'
                                  ? 'Total: ${_azureStats!['incoming_count']}'
                                  : 'Attended: $attendedIncoming',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 4),
                            if (_azureStats == null || _dateFilterPreset != 'all')
                              Text('Missed: $missedIncoming', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)))
                            else
                              const Text('Synced to Cloud', style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            if (_azureStats == null || _dateFilterPreset != 'all')
                              Text('Duration: ${_formatDuration(totalIncomingSeconds)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF1F2937), width: 1.2),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.call_made_rounded, size: 16, color: Color(0xFF3B82F6)),
                                SizedBox(width: 6),
                                Text(
                                  'Outgoing',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _azureStats != null && _dateFilterPreset == 'all'
                                  ? 'Total: ${_azureStats!['outgoing_count']}'
                                  : 'Connected: $connectedOutgoing',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 4),
                            if (_azureStats == null || _dateFilterPreset != 'all')
                              Text('Dialed: $dialedOutgoing', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)))
                            else
                              const Text('Synced to Cloud', style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            if (_azureStats == null || _dateFilterPreset != 'all')
                              Text('Duration: ${_formatDuration(totalOutgoingSeconds)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                // Render Weekly performance trend bar chart below
                _buildWeeklyTrendChart(),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Sync Status: $syncedCalls Synced • $unsyncedCalls Pending',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                    ),
                    if (unsyncedCalls > 0)
                      const Icon(Icons.sync_problem_outlined, size: 14, color: Color(0xFF1F8FFF))
                    else
                      const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFF00E6B8)),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Call Logs',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      showOnlyUnresponded = !showOnlyUnresponded;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: showOnlyUnresponded ? const Color(0xFF881337).withOpacity(0.2) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: showOnlyUnresponded ? const Color(0xFFFDA4AF).withOpacity(0.3) : const Color(0xFF1E293B),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          showOnlyUnresponded ? Icons.filter_alt_rounded : Icons.filter_alt_outlined,
                          size: 14,
                          color: showOnlyUnresponded ? const Color(0xFFFDA4AF) : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          showOnlyUnresponded ? 'Only Unresponded' : 'Filter Unresponded',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: showOnlyUnresponded ? const Color(0xFFFDA4AF) : const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF1E293B)),
                  ],
                ),
              ),
              if (displayedLogs.isEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 80),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          showOnlyUnresponded ? Icons.mark_email_read_rounded : Icons.call_end_rounded,
                          size: 48,
                          color: const Color(0xFF1E293B),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          showOnlyUnresponded
                              ? 'No unresponded missed calls!'
                              : 'No call logs detected',
                          style: const TextStyle(fontSize: 16, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                final log = displayedLogs[index];
                final rawType = (log['call_type'] ?? '').toString().toLowerCase();
                final duration = (log['duration_seconds'] as num? ?? 0).toInt();
                final isSynced = log['is_synced'] == 1;

                bool isIncoming = rawType == 'incoming' || rawType == 'missed' || rawType == 'rejected' || rawType == 'blocked';
                bool isMissed = isIncoming && (rawType != 'incoming' || duration == 0);
                bool isDialed = !isIncoming && (rawType == 'outgoing' && duration == 0);
                final isUnrespondedAlert = unrespondedMissedCallLocalIds.contains(log['id'] as int? ?? -1);

                Color categoryColor = Colors.grey;
                IconData iconData = Icons.call_end;

                if (isIncoming) {
                  if (isMissed) {
                    categoryColor = const Color(0xFFE11D48); // Rose red
                    iconData = Icons.call_missed_rounded;
                  } else {
                    categoryColor = const Color(0xFF00E6B8); // Mint green
                    iconData = Icons.call_received_rounded;
                  }
                } else {
                  if (isDialed) {
                    categoryColor = const Color(0xFF8B5CF6); // Purple
                    iconData = Icons.call_missed_outgoing_rounded;
                  } else {
                    categoryColor = const Color(0xFF1F8FFF); // Electric blue
                    iconData = Icons.call_made_rounded;
                  }
                }

                return Card(
                  color: const Color(0xFF111827),
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: const Color(0xFF1F2937).withOpacity(0.8), width: 1.2),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(color: categoryColor, width: 4.5),
                      ),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: categoryColor.withOpacity(0.12),
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
                        style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC), letterSpacing: 0.1),
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
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                        if (!isMissed && !isDialed) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Duration: ${_formatDuration(duration)}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                          ),
                        ],
                        if (isUnrespondedAlert) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF881337).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFDA4AF).withOpacity(0.3)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.error_outline_rounded, color: Color(0xFFFDA4AF), size: 12),
                                SizedBox(width: 4),
                                Text(
                                  'UNRESPONDED (> 60 mins)',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFFDA4AF),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    trailing: Icon(
                      isSynced ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
                      color: isSynced ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
                      size: 20,
                    ),
                  ),
                ),
              );
            },
                      childCount: displayedLogs.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (_showBackToTopButton)
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton(
              mini: true,
              onPressed: () {
                _scrollController.animateTo(
                  0,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeInOut,
                );
              },
              backgroundColor: const Color(0xFF1F8FFF),
              child: const Icon(Icons.keyboard_arrow_up_rounded, color: Colors.white),
            ),
          ),
      ],
    );
}

  Widget _buildFilterChip(String label, String preset) {
    final isSelected = _dateFilterPreset == preset;
    return GestureDetector(
      onTap: () => _applyPreset(preset),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1F8FFF) : const Color(0xFF0E1528),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF1F8FFF) : const Color(0xFF1E293B),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }
}
