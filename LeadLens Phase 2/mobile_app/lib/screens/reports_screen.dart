import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:io';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';
import 'warrior_home_screen.dart';

import 'permission_disclosure_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  static const platform = MethodChannel('com.shoption.calltracker/tracking');

  Map<String, dynamic>? _reportsData;
  bool _isLoading = true;
  String? _errorMessage;
  String? _userRole;
  String _userName = '';
  String? _selectedLeaderId;
  String? _selectedWarriorId;
  String _hierarchySearchQuery = '';
  final Set<String> _expandedNodeIds = {};
  final TextEditingController _searchController = TextEditingController();
  bool _showSuggestions = false;

  bool isTrackingActive = false;
  bool permissionsGranted = false;
  Timer? _statusPingTimer;

  // ── Date Filter ──
  String _dateFilterPreset = 'today';
  DateTime? _filterStartDate = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
  DateTime? _filterEndDate = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day, 23, 59, 59);

  String _formatDuration(num seconds) {
    if (seconds == 0) return '0s';
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = (seconds % 60).toInt();
    
    final List<String> parts = [];
    if (h > 0) parts.add('${h}h');
    if (m > 0) parts.add('${m}m');
    if (s > 0 || parts.isEmpty) parts.add('${s}s');
    return parts.join(' ');
  }

  int _getWarriorTotalTalkTime(dynamic warrior) {
    try {
      if (warrior == null) return 0;
      final List<dynamic> calls = warrior['calls'] ?? [];
      int total = 0;
      for (final call in calls) {
        if (call == null) continue;
        final type = (call['call_type'] ?? '').toString().toLowerCase();
        final duration = (call['duration_seconds'] as num? ?? 0).toInt();
        if ((type == 'incoming' || type == 'outgoing') && duration > 0) {
          total += duration;
        }
      }
      return total;
    } catch (e) {
      debugPrint('Error calculating talk time: $e');
      return 0;
    }
  }

  // Helper to build the hierarchy tree for the performance section
  List<dynamic> _buildHierarchyTree(List<dynamic> allWarriors) {
    final Set<String> allIds = allWarriors.map((w) => w['warrior_id'].toString().toLowerCase()).toSet();
    
    // If a specific manager/leader/warrior is selected, make that person the root
    if (_selectedLeaderId != null && _selectedLeaderId != 'all') {
      for (final w in allWarriors) {
        if (w['warrior_id'].toString().toLowerCase() == _selectedLeaderId!.toLowerCase()) {
          return [w];
        }
      }
    }
    if (_selectedWarriorId != null && _selectedWarriorId != 'all') {
      for (final w in allWarriors) {
        if (w['warrior_id'].toString().toLowerCase() == _selectedWarriorId!.toLowerCase()) {
          return [w];
        }
      }
    }

    final List<dynamic> roots = [];
    for (var w in allWarriors) {
      final managerId = w['manager_id']?.toString();
      if (managerId == null || !allIds.contains(managerId.toLowerCase())) {
        roots.add(w);
      }
    }
    roots.sort((a, b) => _getWarriorTotalTalkTime(b).compareTo(_getWarriorTotalTalkTime(a)));
    return roots;
  }

  List<dynamic> _getRecursiveSubtree(String managerId, List<dynamic> allWarriors, Set<String> visited) {
    final String targetManagerId = managerId.toLowerCase();
    if (visited.contains(targetManagerId)) return [];
    visited.add(targetManagerId);
    
    final List<dynamic> descendants = [];
    // Find the manager themselves
    for (final w in allWarriors) {
      if (w['warrior_id'].toString().toLowerCase() == targetManagerId) {
        descendants.add(w);
        break;
      }
    }
    
    // Find direct children
    final directChildren = allWarriors.where((w) => w['manager_id']?.toString().toLowerCase() == targetManagerId && w['warrior_id']?.toString().toLowerCase() != targetManagerId).toList();
    for (var child in directChildren) {
      descendants.addAll(_getRecursiveSubtree(child['warrior_id'].toString(), allWarriors, visited));
    }
    return descendants;
  }

  // Recursive widget builder for the performance tree
  Widget _buildPerformanceTreeNodes(List<dynamic> nodes, List<dynamic> allWarriors, int depth) {
    final sortedNodes = List<dynamic>.from(nodes)
      ..sort((a, b) => _getWarriorTotalTalkTime(b).compareTo(_getWarriorTotalTalkTime(a)));

    return Column(
      children: sortedNodes.map<Widget>((warrior) {
        final nodeId = warrior['warrior_id'].toString();
        final name = warrior['full_name']?.toString() ?? '';
        final isTracking = warrior['is_tracking_enabled'] == true;
        
        final children = allWarriors.where((w) => w['manager_id']?.toString().toLowerCase() == nodeId.toLowerCase() && w['warrior_id']?.toString().toLowerCase() != nodeId.toLowerCase()).toList();
        children.sort((a, b) => _getWarriorTotalTalkTime(b).compareTo(_getWarriorTotalTalkTime(a)));
        final bool hasChildren = children.isNotEmpty;
        final bool isExpanded = _expandedNodeIds.contains(nodeId);

        final List<dynamic> calls = warrior['calls'] ?? [];
        int attendedIncoming = 0;
        int missedIncoming = 0;
        int connectedOutgoing = 0;
        int dialedOutgoing = 0;
        int totalIncomingSecs = 0;
        int totalOutgoingSecs = 0;

        for (final call in calls) {
          final type = call['call_type'].toString().toLowerCase();
          final duration = (call['duration_seconds'] as num? ?? 0).toInt();

          if (type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked') {
            if (type == 'incoming' && duration > 0) {
              attendedIncoming++;
              totalIncomingSecs += duration;
            } else {
              missedIncoming++;
            }
          } else if (type == 'outgoing') {
            if (duration > 0) {
              connectedOutgoing++;
              totalOutgoingSecs += duration;
            } else {
              dialedOutgoing++;
            }
          }
        }

        return Padding(
          padding: EdgeInsets.only(left: depth * 12.0, bottom: 8.0),
          child: Card(
            color: const Color(0xFF111827),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFF1F2937), width: 1.2),
            ),
            child: Column(
              children: [
                ExpansionTile(
                  iconColor: const Color(0xFF3B82F6),
                  collapsedIconColor: const Color(0xFFF8FAFC),
                  onExpansionChanged: (expanded) {
                    setState(() {
                      if (expanded) {
                        _expandedNodeIds.add(nodeId);
                      } else {
                        _expandedNodeIds.remove(nodeId);
                      }
                    });
                  },
                  leading: Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Icon(
                      hasChildren ? Icons.badge_outlined : Icons.person_outline_rounded,
                      color: hasChildren ? const Color(0xFF6366F1) : const Color(0xFF3B82F6),
                      size: 18,
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                        ),
                      ),
                      if (isTracking)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  subtitle: Text(
                    '${warrior['total_calls']} calls • ${_formatDuration(warrior['total_calling_seconds'] as num? ?? 0)} attended',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  children: [
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Incoming: ${warrior['incoming_calls_count']} calls',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFF8FAFC)),
                                    ),
                                    const SizedBox(height: 4),
                                    Text('• Attended: $attendedIncoming', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    Text('• Missed: $missedIncoming', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    Text('• Talk Time: ${_formatDuration(totalIncomingSecs)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Outgoing: ${warrior['outgoing_calls_count']} calls',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFF8FAFC)),
                                    ),
                                    const SizedBox(height: 4),
                                    Text('• Connected: $connectedOutgoing', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    Text('• Dialed: $dialedOutgoing', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    Text('• Talk Time: ${_formatDuration(totalOutgoingSecs)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Average Attended Duration: ${(warrior['average_call_seconds'] as num? ?? 0).toStringAsFixed(0)}s',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF3B82F6)),
                          ),
                          const SizedBox(height: 12),
                          const Divider(height: 1, color: Color(0xFF1F2937)),
                          const SizedBox(height: 12),
                          const Text(
                            'Recent Calls Log:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFF8FAFC)),
                          ),
                          const SizedBox(height: 8),
                          if (calls.isEmpty)
                            const Text('No recent call details synced', style: TextStyle(color: Colors.grey, fontSize: 12))
                          else
                            ...(() {
                              final List<dynamic> sortedLogs = [...calls];
                              sortedLogs.sort((a, b) {
                                final tA = a['timestamp']?.toString() ?? '';
                                final tB = b['timestamp']?.toString() ?? '';
                                return tB.compareTo(tA);
                              });

                              final recentLogs = sortedLogs.take(5).toList();

                              return recentLogs.map((call) {
                                final type = call['call_type'].toString().toLowerCase();
                                final number = call['phone_number'] ?? 'Unknown';
                                final time = call['timestamp'] ?? '';
                                final dur = (call['duration_seconds'] as num? ?? 0).toInt();

                                final bool isInc = type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked';
                                final bool isMis = isInc && dur == 0;
                                final bool isDia = !isInc && type == 'outgoing' && dur == 0;

                                Color cColor = Colors.grey;
                                IconData iData = Icons.call_end;

                                if (isInc) {
                                  if (isMis) {
                                    cColor = const Color(0xFFE11D48);
                                    iData = Icons.call_missed_rounded;
                                  } else {
                                    cColor = const Color(0xFF00E6B8);
                                    iData = Icons.call_received_rounded;
                                  }
                                } else {
                                  if (isDia) {
                                    cColor = const Color(0xFF8B5CF6);
                                    iData = Icons.call_missed_outgoing_rounded;
                                  } else {
                                    cColor = const Color(0xFF1F8FFF);
                                    iData = Icons.call_made_rounded;
                                  }
                                }

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 6.0),
                                  child: Row(
                                    children: [
                                      Icon(iData, color: cColor, size: 14),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          '$number  •  $time' + 
                                              (isMis ? ' (Missed)' : isDia ? ' (Dialed)' : ' (${_formatDuration(dur)})'),
                                          style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList();
                            })(),
                        ],
                      ),
                    ),
                  ],
                ),
                if (hasChildren && isExpanded)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0, bottom: 8.0, right: 8.0),
                    child: _buildPerformanceTreeNodes(children, allWarriors, depth + 1),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
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

  Future<void> _exportReport(String type) async {
    try {
      String leaderId = _selectedLeaderId ?? 'all';
      String warriorId = _selectedWarriorId ?? 'all';
      
      final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
      final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
      
      final file = await ApiService.downloadReportAsFile(
        format: type == 'pdf' ? 'pdf' : 'csv',
        leaderId: leaderId,
        warriorId: warriorId,
        startDate: startStr,
        endDate: endStr,
      );
      
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Team Analytics Report (${type.toUpperCase()})',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
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
    _fetchReports();
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
      _fetchReports();
    }
  }

  String _filterLabel() {
    if (_dateFilterPreset == 'custom' && _filterStartDate != null && _filterEndDate != null) {
      final fmt = (DateTime d) => '${d.day}/${d.month}/${d.year}';
      return '${fmt(_filterStartDate!)} – ${fmt(_filterEndDate!)}';
    }
    return '';
  }

  /// Filters a list of call maps by the current date range.
  List<dynamic> _filterCallsByDate(List<dynamic> calls) {
    if (_dateFilterPreset == 'all' || (_filterStartDate == null && _filterEndDate == null)) {
      return calls;
    }
    return calls.where((call) {
      final ts = (call['timestamp'] ?? '').toString();
      final dt = _parseCustomTimestamp(ts);
      if (dt == null) return false;
      if (_filterStartDate != null && dt.isBefore(_filterStartDate!)) return false;
      if (_filterEndDate != null && dt.isAfter(_filterEndDate!)) return false;
      return true;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _fetchReports();
    _checkTrackingStatus();
    _loadUserName();
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _userName = prefs.getString('user_name') ?? '';
      });
    }
  }

  @override
  void dispose() {
    _statusPingTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchReports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final role = prefs.getString('user_role');
      
      final startStr = _filterStartDate != null ? _filterStartDate!.toIso8601String().split('T')[0] : null;
      final endStr = _filterEndDate != null ? _filterEndDate!.toIso8601String().split('T')[0] : null;
      
      final data = await ApiService.getReports(
        startDate: startStr,
        endDate: endStr,
      );
      setState(() {
        _userRole = role;
        _reportsData = data;
        _selectedLeaderId ??= 'all';
        _selectedWarriorId ??= 'all';
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
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

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
        onRefresh: _fetchReports,
        color: const Color(0xFF1F8FFF),
        child: _isLoading && _reportsData == null
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF1F8FFF)))
            : _errorMessage != null
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF881337).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFDA4AF).withOpacity(0.3)),
                        ),
                        child: Text(_errorMessage!, style: const TextStyle(color: Color(0xFFFDA4AF))),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _fetchReports,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1F8FFF)),
                        child: const Text('Retry', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  )
                : _reportsData == null
                    ? ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                          const Center(child: Text('No reports data available.', style: TextStyle(color: Color(0xFF94A3B8)))),
                        ],
                      )
                    : _buildReportContent(),
      );
  }

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

  Widget _buildReportContent() {
    final allWarriors = _reportsData!['warriors'] as List<dynamic>? ?? [];

    // Extract unique managers/leaders
    final Set<String> leaderIds = {};
    final List<Map<String, String>> leadersList = [];
    for (var w in allWarriors) {
      final mId = w['manager_id'];
      final mName = w['manager_name'];
      if (mId != null && mName != null && !leaderIds.contains(mId.toString())) {
        leaderIds.add(mId.toString());
        leadersList.add({'id': mId.toString(), 'name': mName.toString()});
      }
    }

    // Determine available warriors based on selected leader
    final String? normalizedRole = _userRole?.toLowerCase();
    final List<dynamic> availableWarriorsForDropdown = (_selectedLeaderId == 'all' || normalizedRole == 'group_leader')
        ? allWarriors
        : allWarriors.where((w) {
            final mId = w['manager_id']?.toString().toLowerCase();
            return mId == _selectedLeaderId?.toLowerCase();
          }).toList();

    // Reset selected warrior if it is not in the available warriors list
    if (_selectedWarriorId != 'all' && !availableWarriorsForDropdown.any((w) {
      final wId = w['warrior_id']?.toString().toLowerCase();
      return wId == _selectedWarriorId?.toLowerCase();
    })) {
      _selectedWarriorId = 'all';
    }

    // Filter calls for each warrior client-side based on date range
    // before computing aggregate stats
    // Filter strictly based on explicitly selected leader or warrior
    List<dynamic> filteredWarriors = allWarriors;
    if (normalizedRole == 'admin' || normalizedRole == 'super_admin') {
      if (_selectedLeaderId != 'all' && _selectedLeaderId != null) {
        filteredWarriors = _getRecursiveSubtree(_selectedLeaderId!, allWarriors, {});
      }
    }
    if (_selectedWarriorId != 'all' && _selectedWarriorId != null) {
      filteredWarriors = filteredWarriors.where((w) {
        final wId = w['warrior_id']?.toString().toLowerCase();
        return wId == _selectedWarriorId!.toLowerCase();
      }).toList();
    }

    // Apply date filter to calls inside each warrior (client-side)
    final List<dynamic> dateFilteredWarriors = filteredWarriors.map((w) {
      final wMap = Map<String, dynamic>.from(w as Map);
      final rawCalls = wMap['calls'] as List<dynamic>? ?? [];
      wMap['calls'] = _filterCallsByDate(rawCalls);
      return wMap;
    }).toList();

    // Compute dynamic aggregate stats from date-filtered warriors
    int totalCalls = 0;
    num totalSeconds = 0;
    int incomingCallsCount = 0;
    int outgoingCallsCount = 0;
    int globalAttendedIncoming = 0;
    int globalMissedIncoming = 0;
    int globalConnectedOutgoing = 0;
    int globalDialedOutgoing = 0;
    int globalIncomingSeconds = 0;
    int globalOutgoingSeconds = 0;

    for (var w in dateFilteredWarriors) {
      // Use filtered calls for all count/duration metrics
      final List<dynamic> filteredCalls = w['calls'] as List<dynamic>? ?? [];
      final int wTotal = filteredCalls.length;
      final int wIncoming = filteredCalls.where((c) {
        final t = (c['call_type'] ?? '').toString().toLowerCase();
        return t == 'incoming' || t == 'missed' || t == 'rejected' || t == 'blocked';
      }).length;
      final int wOutgoing = filteredCalls.where((c) {
        return (c['call_type'] ?? '').toString().toLowerCase() == 'outgoing';
      }).length;
      final num wSeconds = filteredCalls.fold(0, (sum, c) => sum + (c['duration_seconds'] as num? ?? 0));

      totalCalls += wTotal;
      totalSeconds += wSeconds;
      incomingCallsCount += wIncoming;
      outgoingCallsCount += wOutgoing;

      for (final call in filteredCalls) {
        final type = call['call_type'].toString().toLowerCase();
        final duration = (call['duration_seconds'] as num? ?? 0).toInt();
        if (type == 'incoming' || type == 'missed' || type == 'rejected' || type == 'blocked') {
          if (type == 'incoming' && duration > 0) {
            globalAttendedIncoming++;
            globalIncomingSeconds += duration;
          } else {
            globalMissedIncoming++;
          }
        } else if (type == 'outgoing') {
          if (duration > 0) {
            globalConnectedOutgoing++;
            globalOutgoingSeconds += duration;
          } else {
            globalDialedOutgoing++;
          }
        }
      }
    }


    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        // ── Date Filter Row ──
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF0E1528),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_month_rounded, size: 14, color: Color(0xFF1F8FFF)),
                  const SizedBox(width: 6),
                  const Text(
                    'DATE FILTER',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF94A3B8),
                      letterSpacing: 0.5,
                    ),
                  ),
                  if (_dateFilterPreset != 'all') ...[
                    const Spacer(),
                    GestureDetector(
                      onTap: () => _applyPreset('all'),
                      child: const Text(
                        'Clear',
                        style: TextStyle(fontSize: 11, color: Color(0xFF1F8FFF), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildDateChip('All Time', 'all'),
                    const SizedBox(width: 8),
                    _buildDateChip('Today', 'today'),
                    const SizedBox(width: 8),
                    _buildDateChip('Yesterday', 'yesterday'),
                    const SizedBox(width: 8),
                    _buildDateChip('Last 7 Days', '7days'),
                    const SizedBox(width: 8),
                    _buildDateChip('Last 30 Days', '30days'),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _pickCustomDateRange,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _dateFilterPreset == 'custom'
                              ? const Color(0xFF1F8FFF)
                              : const Color(0xFF050816),
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
                              color: _dateFilterPreset == 'custom' ? Colors.white : const Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _dateFilterPreset == 'custom' && _filterLabel().isNotEmpty
                                  ? _filterLabel()
                                  : 'Custom Range',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _dateFilterPreset == 'custom' ? Colors.white : const Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),


        // Autocomplete Search Panel card
        (() {
          final Set<String> matchedNames = {};
          final List<dynamic> suggestions = (!_showSuggestions || _hierarchySearchQuery.isEmpty)
            ? []
            : allWarriors.where((w) {
                final name = w['full_name']?.toString().toLowerCase() ?? '';
                final isMatch = name.contains(_hierarchySearchQuery.toLowerCase());
                if (isMatch && !matchedNames.contains(w['warrior_id'].toString())) {
                  matchedNames.add(w['warrior_id'].toString());
                  return true;
                }
                return false;
              }).toList();

          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937), width: 1.2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.search_rounded, size: 18, color: Color(0xFF3B82F6)),
                    const SizedBox(width: 8),
                    const Text(
                      'Search Team Member',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF8FAFC),
                      ),
                    ),
                    const Spacer(),
                    if (_selectedLeaderId != 'all' || _selectedWarriorId != 'all')
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedLeaderId = 'all';
                            _selectedWarriorId = 'all';
                            _hierarchySearchQuery = '';
                            _searchController.clear();
                            _showSuggestions = false;
                          });
                          _fetchReports();
                        },
                        child: const Text('Reset', style: TextStyle(fontSize: 12, color: Color(0xFF3B82F6))),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _searchController,
                  style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 13),
                  onChanged: (val) {
                    setState(() {
                      _hierarchySearchQuery = val;
                      _showSuggestions = true;
                    });
                  },
                  decoration: InputDecoration(
                    hintText: 'Type manager or employee name...',
                    hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF3B82F6), size: 18),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, color: Color(0xFF94A3B8), size: 18),
                            onPressed: () {
                              setState(() {
                                _searchController.clear();
                                _hierarchySearchQuery = '';
                            _searchController.clear();
                              });
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFF0E1528),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF1E293B)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF1E293B)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
                    ),
                  ),
                ),
                // Render sleek Active Selected Tag if resolvedLeaderId/resolvedWarriorId is selected
                if (_selectedLeaderId != 'all' && _selectedLeaderId != null) ...[
                  const SizedBox(height: 10),
                  (() {
                    final matched = allWarriors.firstWhere(
                      (w) => w['warrior_id'].toString().toLowerCase() == _selectedLeaderId!.toLowerCase(),
                      orElse: () => null,
                    );
                    if (matched == null) return const SizedBox.shrink();
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.account_tree_rounded, color: Color(0xFF3B82F6), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Showing subtree for: ${matched['full_name']}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFFF8FAFC), fontWeight: FontWeight.w500),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedLeaderId = 'all';
                                _selectedWarriorId = 'all';
                                _hierarchySearchQuery = '';
                                _searchController.clear();
                              });
                              _fetchReports();
                            },
                            child: const Icon(Icons.close_rounded, color: Color(0xFFEF4444), size: 16),
                          ),
                        ],
                      ),
                    );
                  })(),
                ],
                if (suggestions.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    constraints: const BoxConstraints(maxHeight: 220),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E1528),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: suggestions.length,
                        separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFF1E293B)),
                        itemBuilder: (context, idx) {
                          final sug = suggestions[idx];
                          final name = sug['full_name']?.toString() ?? '';
                          const Color neutralColor = Color(0xFF3B82F6); // Neutral professional blue
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                            leading: CircleAvatar(
                              radius: 14,
                              backgroundColor: neutralColor.withOpacity(0.12),
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: neutralColor),
                              ),
                            ),
                            title: Text(
                              name,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                            ),
                            onTap: () {
                              setState(() {
                                final nodeId = sug['warrior_id'].toString();
                                _selectedLeaderId = nodeId;
                                _selectedWarriorId = 'all';
                                _hierarchySearchQuery = name;
                                _searchController.text = name;
                                _showSuggestions = false;
                              });
                              _fetchReports();
                            },
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        })(),

        // Export Buttons Row
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _exportReport('csv'),
                  icon: const Icon(Icons.download_rounded, size: 18, color: Colors.white),
                  label: const Text('Export Excel', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1F8FFF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _exportReport('pdf'),
                  icon: const Icon(Icons.picture_as_pdf_rounded, size: 18, color: Color(0xFF8B5CF6)),
                  label: const Text('Export PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF8B5CF6),
                    side: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ),

        // KPI Cards Row
        Row(
          children: [
            Expanded(
              child: _buildKpiCard(
                'Total Calls',
                totalCalls.toString(),
                Icons.phone_outlined,
                const Color(0xFF00E6B8),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Total Duration',
                _formatDuration(totalSeconds),
                Icons.hourglass_bottom_outlined,
                const Color(0xFF1F8FFF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildKpiCard(
                'Incoming',
                incomingCallsCount.toString(),
                Icons.call_received_outlined,
                const Color(0xFF00E6B8),
                subtitle: 'Attended: $globalAttendedIncoming  •  Missed: $globalMissedIncoming\nDuration: ${_formatDuration(globalIncomingSeconds)}',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Outgoing',
                outgoingCallsCount.toString(),
                Icons.call_made_outlined,
                const Color(0xFF1F8FFF),
                subtitle: 'Connected: $globalConnectedOutgoing  •  Dialed: $globalDialedOutgoing\nDuration: ${_formatDuration(globalOutgoingSeconds)}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Employee Performance',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 12),
        if (dateFilteredWarriors.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40.0),
            child: Center(
              child: Text(
                'No employees matched this selection.',
                style: TextStyle(color: Color(0xFF94A3B8)),
              ),
            ),
          )
        else
          _buildPerformanceTreeNodes(
            _buildHierarchyTree(dateFilteredWarriors),
            dateFilteredWarriors,
            0,
          ),
      ],
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color, {String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1528),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFFF8FAFC),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDateChip(String label, String preset) {
    final isSelected = _dateFilterPreset == preset;
    return GestureDetector(
      onTap: () => _applyPreset(preset),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1F8FFF) : const Color(0xFF050816),
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

  void _showSearchSelectionDialog({
    required String title,
    required List<Map<String, String>> items,
    required String selectedValue,
    required ValueChanged<String> onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E1528),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        String modalSearchQuery = '';
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            final filtered = items.where((item) {
              final name = (item['name'] ?? '').toLowerCase();
              return name.contains(modalSearchQuery.toLowerCase().trim());
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
              child: Column(
                children: [
                  // Handle indicator
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Search Field
                  TextField(
                    style: const TextStyle(color: Color(0xFFF8FAFC)),
                    decoration: InputDecoration(
                      hintText: 'Search...',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF1F8FFF), size: 20),
                      filled: true,
                      fillColor: const Color(0xFF050816),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1E293B), width: 1.5),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F8FFF), width: 1.5),
                      ),
                    ),
                    onChanged: (val) {
                      setModalState(() {
                        modalSearchQuery = val;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  // Items List
                  Expanded(
                    child: ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final item = filtered[index];
                        final isSel = item['id'] == selectedValue;
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                          title: Text(
                            item['name'] ?? '',
                            style: TextStyle(
                              color: isSel ? const Color(0xFF1F8FFF) : const Color(0xFFF8FAFC),
                              fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          trailing: isSel
                              ? const Icon(Icons.check_circle_rounded, color: Color(0xFF1F8FFF), size: 20)
                              : null,
                          onTap: () {
                            onSelected(item['id']!);
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
