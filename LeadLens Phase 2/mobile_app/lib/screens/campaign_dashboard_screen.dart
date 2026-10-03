import 'package:flutter/material.dart';
import '../services/auto_dialer_service.dart';

class CampaignDashboardScreen extends StatefulWidget {
  const CampaignDashboardScreen({super.key});

  @override
  State<CampaignDashboardScreen> createState() => _CampaignDashboardScreenState();
}

class _CampaignDashboardScreenState extends State<CampaignDashboardScreen> {
  Map<String, dynamic> _stats = {
    'total': 0,
    'completed': 0,
    'noAnswer': 0,
    'busy': 0,
    'failed': 0,
    'skipped': 0,
    'remaining': 0,
  };

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await AutoDialerService.getCampaignStats(campaignId: 'pune_leads');
    if (mounted) {
      setState(() {
        _stats = stats;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Colors.blueAccent));
    }

    final total = _stats['total'] as int? ?? 0;
    final completed = _stats['completed'] as int? ?? 0;
    final remaining = _stats['remaining'] as int? ?? 0;
    final noAnswer = _stats['noAnswer'] as int? ?? 0;
    final busy = _stats['busy'] as int? ?? 0;
    final failed = _stats['failed'] as int? ?? 0;
    final skipped = _stats['skipped'] as int? ?? 0;

    final connectionRate = total > 0 ? ((completed / total) * 100).toStringAsFixed(1) : '0.0';

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Campaign Metrics', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatCard('Total Leads', total.toString(), Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Completed', completed.toString(), Colors.green)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatCard('Remaining', remaining.toString(), Colors.amber)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Connection Rate', '$connectionRate%', Colors.teal)),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Dispositions Breakdown', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildListItem('No Answer', noAnswer, Colors.orange),
            _buildListItem('Busy', busy, Colors.amber),
            _buildListItem('Failed', failed, Colors.red),
            _buildListItem('Skipped', skipped, Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildListItem(String label, int count, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(radius: 5, backgroundColor: color),
              const SizedBox(width: 10),
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
            ],
          ),
          Text(count.toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }
}
