import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../services/auto_dialer_service.dart';

class CallHistoryScreen extends StatefulWidget {
  const CallHistoryScreen({super.key});

  @override
  State<CallHistoryScreen> createState() => _CallHistoryScreenState();
}

class _CallHistoryScreenState extends State<CallHistoryScreen> {
  List<Map<String, dynamic>> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final history = await AutoDialerService.getCallHistory(campaignId: 'pune_leads');
    if (mounted) {
      setState(() {
        _history = history;
        _loading = false;
      });
    }
  }

  String _formatDuration(int seconds) {
    final mins = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.greenAccent;
      case 'NO_ANSWER':
        return Colors.orangeAccent;
      case 'BUSY':
        return Colors.amberAccent;
      case 'FAILED':
        return Colors.redAccent;
      case 'SKIPPED':
        return Colors.grey;
      default:
        return Colors.blueAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Colors.blueAccent));
    }

    if (_history.isEmpty) {
      return const Center(
        child: Text('No call history records found.', style: TextStyle(color: Colors.white70)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _history.length,
        itemBuilder: (context, index) {
          final item = _history[index];
          final status = item['status'] as String? ?? 'READY';
          final durationSecs = item['durationSeconds'] as int? ?? 0;
          final simUsed = item['simUsed'] as String? ?? 'SIM 1';

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getStatusColor(status).withOpacity(0.2),
                child: Icon(Icons.phone_outlined, color: _getStatusColor(status), size: 20),
              ),
              title: Text(item['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Row(
                children: [
                  Expanded(
                    child: Text('${item['phoneNumber']} • $simUsed', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  ),
                ],
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        status,
                        style: TextStyle(color: _getStatusColor(status), fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(height: 2),
                      Text(_formatDuration(durationSecs), style: const TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'monospace')),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
