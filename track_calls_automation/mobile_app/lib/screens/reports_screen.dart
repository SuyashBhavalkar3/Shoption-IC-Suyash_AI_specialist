import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  Map<String, dynamic>? _reportsData;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await ApiService.getReports();
      setState(() {
        _reportsData = data;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const ShoptionAppBar(
        title: 'Team Analytics',
        subtitle: 'Call Performance Reports',
      ),
      body: RefreshIndicator(
        onRefresh: _fetchReports,
        color: const Color(0xFFFF6B00),
        child: _isLoading && _reportsData == null
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF6B00)))
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
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111111)),
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

  Widget _buildReportContent() {
    final warriorsList = _reportsData!['warriors'] as List<dynamic>? ?? [];
    final hours = _reportsData!['overall_total_calling_hours'] as num? ?? 0.0;
    final avgSec = _reportsData!['overall_average_call_seconds'] as num? ?? 0.0;

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        // KPI Cards Row
        Row(
          children: [
            Expanded(
              child: _buildKpiCard(
                'Total Calls',
                _reportsData!['overall_total_calls'].toString(),
                Icons.phone_outlined,
                const Color(0xFFFF6B00),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Total Hours',
                hours.toStringAsFixed(1),
                Icons.hourglass_bottom_outlined,
                const Color(0xFF111111),
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
                _reportsData!['overall_incoming_calls_count'].toString(),
                Icons.call_received_outlined,
                Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiCard(
                'Outgoing',
                _reportsData!['overall_outgoing_calls_count'].toString(),
                Icons.call_made_outlined,
                Colors.blueAccent,
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
            color: Color(0xFF111111),
          ),
        ),
        const SizedBox(height: 12),
        if (warriorsList.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40.0),
            child: Center(
              child: Text(
                'No warriors report to you currently.',
                style: TextStyle(color: Color(0xFF666666)),
              ),
            ),
          )
        else
          ...warriorsList.map((warrior) {
            final wHours = warrior['total_calling_hours'] as num? ?? 0.0;
            return Card(
              color: const Color(0xFFF9F9F9),
              elevation: 0,
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFEEEEEE)),
              ),
              child: ExpansionTile(
                iconColor: const Color(0xFFFF6B00),
                collapsedIconColor: const Color(0xFF111111),
                title: Text(
                  warrior['full_name'],
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                ),
                subtitle: Text(
                  '${warrior['total_calls']} calls • ${wHours.toStringAsFixed(1)} hours',
                  style: const TextStyle(color: Color(0xFF666666), fontSize: 13),
                ),
                children: [
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Incoming: ${warrior['incoming_calls_count']}', style: const TextStyle(fontSize: 13)),
                            Text('Outgoing: ${warrior['outgoing_calls_count']}', style: const TextStyle(fontSize: 13)),
                            Text('Avg: ${(warrior['average_call_seconds'] as num? ?? 0).toStringAsFixed(0)}s', style: const TextStyle(fontSize: 13)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Recent Calls Log:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 8),
                        if ((warrior['calls'] as List).isEmpty)
                          const Text('No recent call details synced', style: TextStyle(color: Colors.grey, fontSize: 12))
                        else
                          ...List.generate(
                            (warrior['calls'] as List).length > 5 ? 5 : (warrior['calls'] as List).length,
                            (index) {
                              final call = warrior['calls'][index];
                              final isIncoming = call['call_type'].toString().toLowerCase() == 'incoming';
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4.0),
                                child: Row(
                                  children: [
                                    Icon(
                                      isIncoming ? Icons.call_received : Icons.call_made,
                                      size: 14,
                                      color: isIncoming ? Colors.green : Colors.blue,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        call['phone_number'],
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    Text(
                                      '${call['duration_seconds']}s',
                                      style: const TextStyle(fontSize: 12, color: Colors.grey),
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

  Widget _buildKpiCard(String label, String value, IconData icon, Color color) {
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
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111111),
            ),
          ),
        ],
      ),
    );
  }
}
