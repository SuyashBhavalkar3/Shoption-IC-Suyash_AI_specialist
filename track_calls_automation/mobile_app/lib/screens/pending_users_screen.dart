import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class PendingUsersScreen extends StatefulWidget {
  const PendingUsersScreen({super.key});

  @override
  State<PendingUsersScreen> createState() => _PendingUsersScreenState();
}

class _PendingUsersScreenState extends State<PendingUsersScreen> {
  List<dynamic> _pendingUsers = [];
  List<dynamic> _groupLeaders = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final pending = await ApiService.getPendingUsers();
      final team = await ApiService.getMyTeam();
      
      // Filter out only approved group leaders
      final leaders = team.where((u) => u['role'] == 'group_leader' && u['is_approved'] == true).toList();

      setState(() {
        _pendingUsers = pending;
        _groupLeaders = leaders;
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

  Future<void> _handleApproval(String userId, String role, String? leaderId) async {
    setState(() {
      _isLoading = true;
    });

    try {
      await ApiService.approveUser(userId: userId, leaderId: leaderId);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('User approved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
      _fetchData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Approval failed: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showApprovalDialog(Map<String, dynamic> user) {
    String? selectedLeaderId;
    if (_groupLeaders.isNotEmpty) {
      selectedLeaderId = _groupLeaders.first['id'];
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              title: Text('Approve ${user['full_name']}'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Role: ${user['role'].toString().toUpperCase()}', 
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF666666))
                  ),
                  const SizedBox(height: 15),
                  if (user['role'] == 'warrior') ...[
                    const Text('Assign to Group Leader:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    _groupLeaders.isEmpty
                        ? const Text(
                            'No approved group leaders available. Please approve a group leader first.',
                            style: TextStyle(color: Colors.redAccent, fontSize: 13),
                          )
                        : DropdownButtonFormField<String>(
                            value: selectedLeaderId,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: const Color(0xFFF9F9F9),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                              ),
                            ),
                            items: _groupLeaders.map<DropdownMenuItem<String>>((l) {
                              return DropdownMenuItem<String>(
                                value: l['id'],
                                child: Text(l['full_name']),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setDialogState(() {
                                selectedLeaderId = val;
                              });
                            },
                          ),
                  ] else ...[
                    const Text('No leader assignment is needed for this role.'),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
                ),
                ElevatedButton(
                  onPressed: (user['role'] == 'warrior' && selectedLeaderId == null)
                      ? null
                      : () {
                          Navigator.pop(context);
                          _handleApproval(user['id'], user['role'], selectedLeaderId);
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6B00),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey[300],
                  ),
                  child: const Text('Approve'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const ShoptionAppBar(
        title: 'Approvals',
        subtitle: 'Pending Registrations',
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFFFF6B00),
        child: _isLoading && _pendingUsers.isEmpty
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
                        onPressed: _fetchData,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111111)),
                        child: const Text('Retry'),
                      ),
                    ],
                  )
                : _pendingUsers.isEmpty
                    ? ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                          const Center(
                            child: Column(
                              children: [
                                Icon(Icons.check_circle_outline, size: 60, color: Colors.green),
                                SizedBox(height: 16),
                                Text(
                                  'All Caught Up!',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                                ),
                                SizedBox(height: 8),
                                Text('No pending registration requests.', style: TextStyle(color: Color(0xFF666666))),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _pendingUsers.length,
                        itemBuilder: (context, index) {
                          final user = _pendingUsers[index];
                          return Card(
                            color: const Color(0xFFF9F9F9),
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFFEEEEEE)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: const Color(0xFFEEEEEE),
                                    foregroundColor: const Color(0xFF111111),
                                    child: Text(user['full_name'][0].toString().toUpperCase()),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          user['full_name'],
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF111111)),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(user['email'], style: const TextStyle(color: Color(0xFF666666), fontSize: 13)),
                                        const SizedBox(height: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFF0E5),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            user['role'].toString().toUpperCase(),
                                            style: const TextStyle(
                                              color: Color(0xFFFF6B00),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 10,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: () => _showApprovalDialog(user),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF111111),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Approve'),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
