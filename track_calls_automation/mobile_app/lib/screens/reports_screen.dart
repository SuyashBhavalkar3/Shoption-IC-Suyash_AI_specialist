import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';
import 'warrior_home_screen.dart';

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
  String? _selectedLeaderId;
  String? _selectedWarriorId;

  bool isTrackingActive = false;
  bool permissionsGranted = false;
  Timer? _statusPingTimer;

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

  Future<void> _exportReport(String type) async {
    try {
      final token = await ApiService.getToken();
      if (token == null) {
        throw Exception('Session token is missing');
      }
      
      final leaderId = _selectedLeaderId ?? 'all';
      final warriorId = _selectedWarriorId ?? 'all';
      
      final baseUrl = ApiService.baseUrl;
      final exportUrl = Uri.parse(
        '$baseUrl/calls/reports/export/$type?token=$token&leader_id=$leaderId&warrior_id=$warriorId'
      );
      
      if (!await launchUrl(exportUrl, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not launch export URL');
      }
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

  @override
  void initState() {
    super.initState();
    _fetchReports();
    _checkTrackingStatus();
  }

  @override
  void dispose() {
    _statusPingTimer?.cancel();
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
      final data = await ApiService.getReports();
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
      if (active) {
        _startStatusPingTimer();
      } else {
        _stopStatusPingTimer();
      }
    } catch (e) {
      debugPrint('Failed to check status: $e');
    }
  }

  void _startStatusPingTimer() {
    _statusPingTimer?.cancel();
    _statusPingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _sendStatusPing(true);
    });
    _sendStatusPing(true);
  }

  void _stopStatusPingTimer() {
    _statusPingTimer?.cancel();
    _statusPingTimer = null;
    _sendStatusPing(false);
  }

  Future<void> _sendStatusPing(bool isEnabled) async {
    final prefs = await SharedPreferences.getInstance();
    final empId = prefs.getString('user_emp_id') ?? '';
    final orgId = prefs.getString('user_org_id') ?? '';
    final systemId = prefs.getString('user_system_id') ?? '';

    if (empId.isEmpty || orgId.isEmpty || systemId.isEmpty) {
      try {
        final user = await ApiService.getMe();
        final updatedEmpId = user['employee_id']?.toString() ?? '';
        final updatedOrgId = user['organisation_id']?.toString() ?? '';
        final updatedSystemId = user['system_id']?.toString() ?? '';

        await prefs.setString('user_emp_id', updatedEmpId);
        await prefs.setString('user_org_id', updatedOrgId);
        await prefs.setString('user_system_id', updatedSystemId);
      } catch (e) {
        debugPrint('Failed to refresh user details for ping: $e');
        return;
      }
    }

    final freshEmpId = prefs.getString('user_emp_id') ?? '';
    final freshOrgId = prefs.getString('user_org_id') ?? '';
    final freshSystemId = prefs.getString('user_system_id') ?? '';

    if (freshSystemId.isEmpty) {
      debugPrint('No system_id found. Skipping ping.');
      return;
    }

    try {
      final now = DateTime.now().toUtc().toIso8601String();
      await ApiService.updateTrackingStatus(
        empId: freshEmpId,
        organisationId: freshOrgId,
        systemId: freshSystemId,
        isTrackingEnabled: isEnabled,
        lastActivityTimestamp: now,
      );
      debugPrint('Status ping sent: enabled=$isEnabled, timestamp=$now');
    } catch (e) {
      debugPrint('Failed to send status ping: $e');
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
    try {
      final bool granted = await platform.invokeMethod('requestRequiredPermissions');
      debugPrint('Required permissions granted status: $granted');
      await _checkTrackingStatus();
    } catch (e) {
      debugPrint('Permission request error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ShoptionAppBar(
        title: 'Team Analytics',
        subtitle: 'Call Performance Reports',
        actions: [
          if (_userRole == 'admin' || _userRole == 'super_admin')
            IconButton(
              icon: const Icon(Icons.manage_accounts_outlined, color: Color(0xFF04693F)),
              tooltip: 'Manage Warriors',
              onPressed: () {
                Navigator.pushNamed(context, '/warrior-management');
              },
            ),
          if (_userRole == 'group_leader' || _userRole == 'admin' || _userRole == 'super_admin')
            IconButton(
              icon: const Icon(Icons.history_rounded, color: Color(0xFF04693F)),
              tooltip: 'My Call History',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const WarriorHomeScreen()),
                );
              },
            ),
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF04693F)),
            tooltip: 'Logout',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchReports,
        color: const Color(0xFF04693F),
        child: _isLoading && _reportsData == null
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF04693F)))
            : _errorMessage != null
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF2F2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent)),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _fetchReports,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF010B26)),
                        child: const Text('Retry'),
                      ),
                    ],
                  )
                : _reportsData == null
                    ? ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                          const Center(child: Text('No reports data available.')),
                        ],
                      )
                    : _buildReportContent(),
      ),
    );
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Logout', style: TextStyle(color: Color(0xFF010B26))),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF04693F),
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
    final List<dynamic> availableWarriorsForDropdown = (_selectedLeaderId == 'all' || _userRole == 'group_leader')
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

    // Filter warriors list for rendering and aggregate computation
    List<dynamic> filteredWarriors = allWarriors;
    if (_userRole == 'admin' || _userRole == 'super_admin') {
      if (_selectedLeaderId != 'all' && _selectedLeaderId != null) {
        filteredWarriors = filteredWarriors.where((w) {
          final mId = w['manager_id']?.toString().toLowerCase();
          return mId == _selectedLeaderId?.toLowerCase();
        }).toList();
      }
    }
    if (_selectedWarriorId != 'all' && _selectedWarriorId != null) {
      filteredWarriors = filteredWarriors.where((w) {
        final wId = w['warrior_id']?.toString().toLowerCase();
        return wId == _selectedWarriorId?.toLowerCase();
      }).toList();
    }

    // Compute dynamic aggregate stats
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

    for (var w in filteredWarriors) {
      totalCalls += (w['total_calls'] as num? ?? 0).toInt();
      totalSeconds += (w['total_calling_seconds'] as num? ?? 0);
      incomingCallsCount += (w['incoming_calls_count'] as num? ?? 0).toInt();
      outgoingCallsCount += (w['outgoing_calls_count'] as num? ?? 0).toInt();

      final List<dynamic> calls = w['calls'] ?? [];
      for (final call in calls) {
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
        // Call Tracking Control Panel
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: const Color(0xFFEEEEEE), width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Call Tracking Control Panel',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF010B26),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Permissions Granted:',
                    style: TextStyle(fontSize: 13, color: Color(0xFF555555)),
                  ),
                  Row(
                    children: [
                      Icon(
                        permissionsGranted ? Icons.check_circle_rounded : Icons.cancel_rounded,
                        color: permissionsGranted ? const Color(0xFF04693F) : const Color(0xFFD32F2F),
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        permissionsGranted ? 'Yes' : 'No',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: permissionsGranted ? const Color(0xFF04693F) : const Color(0xFFD32F2F),
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
                    style: TextStyle(fontSize: 13, color: Color(0xFF555555)),
                  ),
                  Row(
                    children: [
                      Icon(
                        isTrackingActive ? Icons.play_circle_filled_rounded : Icons.stop_circle_rounded,
                        color: isTrackingActive ? const Color(0xFF04693F) : const Color(0xFF888888),
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isTrackingActive ? 'Yes' : 'No',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isTrackingActive ? const Color(0xFF04693F) : const Color(0xFF888888),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (!permissionsGranted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _requestPermissions,
                    icon: const Icon(Icons.security_rounded, size: 16),
                    label: const Text('Grant Required Permissions'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF010B26),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: isTrackingActive ? null : _startTracking,
                        icon: const Icon(Icons.play_arrow_rounded, size: 18),
                        label: const Text('Start Tracking'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF04693F),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: const Color(0xFFEEEEEE),
                          disabledForegroundColor: const Color(0xFF888888),
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
                        onPressed: !isTrackingActive ? null : _stopTracking,
                        icon: const Icon(Icons.stop_rounded, size: 18),
                        label: const Text('Stop Tracking'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFD32F2F),
                          side: BorderSide(color: isTrackingActive ? const Color(0xFFD32F2F) : const Color(0xFFEEEEEE)),
                          disabledForegroundColor: const Color(0xFF888888),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
        // Dropdown Filters Card
        Container(
          margin: const EdgeInsets.only(bottom: 20),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF9F9F9),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEEEEEE)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.filter_list, size: 16, color: Color(0xFF04693F)),
                  const SizedBox(width: 6),
                  Text(
                    _userRole == 'group_leader' ? 'Filter Team' : 'Filter Leader & Team',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF666666),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_userRole == 'admin' || _userRole == 'super_admin') ...[
                DropdownButtonFormField<String>(
                  value: _selectedLeaderId,
                  decoration: const InputDecoration(
                    labelText: 'Group Leader',
                    labelStyle: TextStyle(color: Color(0xFF04693F), fontSize: 13, fontWeight: FontWeight.bold),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF04693F)),
                  items: [
                    const DropdownMenuItem(
                      value: 'all',
                      child: Text('All Leaders', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                    ...leadersList.map((leader) => DropdownMenuItem(
                          value: leader['id'],
                          child: Text(leader['name']!, style: const TextStyle(fontSize: 14)),
                        )),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _selectedLeaderId = val;
                      _selectedWarriorId = 'all';
                    });
                  },
                ),
                const Divider(height: 1, color: Color(0xFFEEEEEE)),
              ],
              DropdownButtonFormField<String>(
                value: _selectedWarriorId,
                decoration: InputDecoration(
                  labelText: _userRole == 'group_leader' ? 'Select Warrior' : 'Warrior',
                  labelStyle: const TextStyle(color: Color(0xFF04693F), fontSize: 13, fontWeight: FontWeight.bold),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF04693F)),
                items: [
                  const DropdownMenuItem(
                    value: 'all',
                    child: Text('All Warriors', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                  ...availableWarriorsForDropdown.map((w) => DropdownMenuItem(
                        value: w['warrior_id'].toString(),
                        child: Text(w['full_name'].toString(), style: const TextStyle(fontSize: 14)),
                      )),
                ],
                onChanged: (val) {
                  setState(() {
                    _selectedWarriorId = val;
                  });
                },
              ),
            ],
          ),
        ),

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
                    backgroundColor: const Color(0xFF04693F),
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
                  icon: const Icon(Icons.picture_as_pdf_rounded, size: 18, color: Color(0xFF04693F)),
                  label: const Text('Export PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF04693F),
                    side: const BorderSide(color: Color(0xFF04693F), width: 1.5),
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
                const Color(0xFF04693F),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Total Duration',
                _formatDuration(totalSeconds),
                Icons.hourglass_bottom_outlined,
                const Color(0xFF010B26),
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
                Colors.green,
                subtitle: 'Attended: $globalAttendedIncoming  •  Missed: $globalMissedIncoming\nDuration: ${_formatDuration(globalIncomingSeconds)}',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Outgoing',
                outgoingCallsCount.toString(),
                Icons.call_made_outlined,
                Colors.blueAccent,
                subtitle: 'Connected: $globalConnectedOutgoing  •  Dialed: $globalDialedOutgoing\nDuration: ${_formatDuration(globalOutgoingSeconds)}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Warrior Performance',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF010B26),
          ),
        ),
        const SizedBox(height: 12),
        if (filteredWarriors.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40.0),
            child: Center(
              child: Text(
                'No warriors matched this selection.',
                style: TextStyle(color: Color(0xFF666666)),
              ),
            ),
          )
        else
          ...filteredWarriors.map((warrior) {

            return Card(
              color: const Color(0xFFF9F9F9),
              elevation: 0,
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFEEEEEE)),
              ),
              child: ExpansionTile(
                iconColor: const Color(0xFF04693F),
                collapsedIconColor: const Color(0xFF010B26),
                title: Text(
                  warrior['full_name'],
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
                ),
                subtitle: Text(
                  '${warrior['total_calls']} calls • ${_formatDuration(warrior['total_calling_seconds'] as num? ?? 0)} attended' +
                      ((_userRole == 'admin' || _userRole == 'super_admin') && warrior['manager_name'] != null
                          ? ' • Leader: ${warrior['manager_name']}'
                          : ''),
                  style: const TextStyle(color: Color(0xFF666666), fontSize: 13),
                ),
                children: [
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: Color(0xFFEEEEEE)),
                        const SizedBox(height: 12),

                        (() {
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

                          return Column(
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
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF010B26)),
                                        ),
                                        const SizedBox(height: 2),
                                        Text('• Attended: $attendedIncoming', style: const TextStyle(fontSize: 11, color: Color(0xFF666666))),
                                        Text('• Missed: $missedIncoming', style: const TextStyle(fontSize: 11, color: Color(0xFF666666))),
                                        Text('• Talk Time: ${_formatDuration(totalIncomingSecs)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666))),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Outgoing: ${warrior['outgoing_calls_count']} calls',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF010B26)),
                                        ),
                                        const SizedBox(height: 2),
                                        Text('• Connected: $connectedOutgoing', style: const TextStyle(fontSize: 11, color: Color(0xFF666666))),
                                        Text('• Dialed: $dialedOutgoing', style: const TextStyle(fontSize: 11, color: Color(0xFF666666))),
                                        Text('• Talk Time: ${_formatDuration(totalOutgoingSecs)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Average Attended Call Duration: ${(warrior['average_call_seconds'] as num? ?? 0).toStringAsFixed(0)}s',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF04693F)),
                              ),
                            ],
                          );
                        })(),
                        const SizedBox(height: 12),
                        const Text(
                          'Recent Calls Log:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF010B26)),
                        ),
                        const SizedBox(height: 8),
                        if ((warrior['calls'] as List).isEmpty)
                          const Text('No recent call details synced', style: TextStyle(color: Colors.grey, fontSize: 12))
                        else
                          ...List.generate(
                            (warrior['calls'] as List).length > 5 ? 5 : (warrior['calls'] as List).length,
                            (index) {
                              final call = warrior['calls'][index];
                              final rawType = call['call_type'].toString().toLowerCase();
                              final duration = (call['duration_seconds'] as num? ?? 0).toInt();

                              bool isIncoming = rawType == 'incoming' || rawType == 'missed' || rawType == 'rejected' || rawType == 'blocked';
                              bool isMissed = isIncoming && (rawType != 'incoming' || duration == 0);
                              bool isDialed = !isIncoming && (rawType == 'outgoing' && duration == 0);

                              String categoryText = '';
                              Color categoryColor = Colors.grey;
                              IconData iconData = Icons.call_end;

                              if (isIncoming) {
                                if (isMissed) {
                                  categoryText = 'Missed call';
                                  categoryColor = Colors.redAccent;
                                  iconData = Icons.call_missed_rounded;
                                } else {
                                  categoryText = 'Incoming (Attended)';
                                  categoryColor = Colors.green;
                                  iconData = Icons.call_received_rounded;
                                }
                              } else {
                                if (isDialed) {
                                  categoryText = 'Dialed (Unconnected)';
                                  categoryColor = Colors.orange;
                                  iconData = Icons.call_missed_outgoing_rounded;
                                } else {
                                  categoryText = 'Outgoing (Connected)';
                                  categoryColor = Colors.blue;
                                  iconData = Icons.call_made_rounded;
                                }
                              }

                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4.0),
                                child: Row(
                                  children: [
                                    Icon(
                                      iconData,
                                      size: 14,
                                      color: categoryColor,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            call['phone_number'],
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                          Text(
                                            isMissed 
                                                ? 'Missed call from ${call['phone_number']} at ${call['timestamp']}' 
                                                : isDialed 
                                                    ? 'Dialed ${call['phone_number']} at ${call['timestamp']}' 
                                                    : '${categoryText} at ${call['timestamp']}',
                                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (!isMissed && !isDialed)
                                      Text(
                                        _formatDuration(duration),
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF666666)),
                                      ),
                                  ],
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color, {String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
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
              Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF666666), fontWeight: FontWeight.bold)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF010B26),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 10, color: Color(0xFF666666), fontWeight: FontWeight.w500),
            ),
          ],
        ],
      ),
    );
  }
}
