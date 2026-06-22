import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class WarriorManagementScreen extends StatefulWidget {
  const WarriorManagementScreen({super.key});

  @override
  State<WarriorManagementScreen> createState() => _WarriorManagementScreenState();
}

class _WarriorManagementScreenState extends State<WarriorManagementScreen> {
  List<dynamic> _users = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadCurrentUserId();
    _loadData();
  }

  Future<void> _loadCurrentUserId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _currentUserId = prefs.getString('user_id');
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final data = await ApiService.getAllUsers();
      setState(() {
        _users = data;
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

  // Get all group leaders for the reassignment dropdown
  List<dynamic> _getGroupLeaders() {
    return _users.where((u) => u['role'] == 'group_leader' && u['is_approved'] == true).toList();
  }

  Future<void> _handleDelete(String userId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Delete User', style: TextStyle(color: Color(0xFF010B26), fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to permanently delete $name? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApiService.deleteUser(userId);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Successfully deleted $name'), backgroundColor: const Color(0xFF04693F)),
        );
        _loadData();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  void _showEditDialog(Map<String, dynamic> user) {
    final fullNameController = TextEditingController(text: user['full_name']);
    final emailController = TextEditingController(text: user['email']);
    final systemIdController = TextEditingController(text: user['system_id'] ?? '');
    String selectedRole = user['role'];
    bool isActive = user['is_active'] ?? true;
    bool isApproved = user['is_approved'] ?? true;
    
    // Manage state of group leader selection
    String? selectedLeaderId = user['manager_id']?.toString();
    final leaders = _getGroupLeaders();
    
    // Ensure selectedLeaderId exists in the leaders list or set to 'none'
    if (selectedLeaderId != null && !leaders.any((l) => l['id'].toString() == selectedLeaderId)) {
      selectedLeaderId = null;
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              title: Text('Edit User: ${user['full_name']}', style: const TextStyle(color: Color(0xFF010B26), fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: fullNameController,
                      decoration: const InputDecoration(labelText: 'Full Name'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: emailController,
                      decoration: const InputDecoration(labelText: 'Email Address'),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: systemIdController,
                      decoration: const InputDecoration(labelText: 'System ID (6-digit mapping)'),
                      maxLength: 6,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: selectedRole,
                      decoration: const InputDecoration(labelText: 'Role'),
                      items: const [
                        DropdownMenuItem(value: 'warrior', child: Text('Warrior')),
                        DropdownMenuItem(value: 'group_leader', child: Text('Group Leader')),
                        DropdownMenuItem(value: 'admin', child: Text('Admin')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() {
                            selectedRole = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    if (selectedRole == 'warrior') ...[
                      DropdownButtonFormField<String>(
                        initialValue: selectedLeaderId ?? 'none',
                        decoration: const InputDecoration(labelText: 'Group Leader (Manager)'),
                        items: [
                          const DropdownMenuItem(value: 'none', child: Text('Unassigned (None)')),
                          ...leaders.map((l) => DropdownMenuItem(
                                value: l['id'].toString(),
                                child: Text(l['full_name'].toString()),
                              )),
                        ],
                        onChanged: (val) {
                          setDialogState(() {
                            selectedLeaderId = val == 'none' ? null : val;
                          });
                        },
                      ),
                      const SizedBox(height: 8),
                    ],
                    SwitchListTile(
                      title: const Text('Active Account', style: TextStyle(fontSize: 14)),
                      value: isActive,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        setDialogState(() {
                          isActive = val;
                        });
                      },
                    ),
                    SwitchListTile(
                      title: const Text('Approved Login', style: TextStyle(fontSize: 14)),
                      value: isApproved,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        setDialogState(() {
                          isApproved = val;
                        });
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(context);
                    try {
                      await ApiService.updateAdminUser(
                        user['id'].toString(),
                        fullName: fullNameController.text.trim(),
                        email: emailController.text.trim(),
                        role: selectedRole,
                        managerId: selectedRole == 'warrior' ? (selectedLeaderId ?? 'none') : 'none',
                        isActive: isActive,
                        isApproved: isApproved,
                        systemId: systemIdController.text.trim(),
                      );
                      messenger.showSnackBar(
                        const SnackBar(content: Text('Successfully updated user info'), backgroundColor: Color(0xFF04693F)),
                      );
                      _loadData();
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Update failed: $e'), backgroundColor: Colors.redAccent),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF04693F),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Save'),
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
    // Separate warriors for better UI organization
    final warriors = _users.where((u) => u['role'] == 'warrior').toList();
    final nonWarriors = _users.where((u) => u['role'] != 'warrior').toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const ShoptionAppBar(
        title: 'User Management',
        subtitle: 'Manage Team Roles & Reassignments',
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF04693F),
        child: _isLoading
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
                        onPressed: _loadData,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF010B26)),
                        child: const Text('Retry'),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (warriors.isNotEmpty) ...[
                        const Text(
                          'Warriors (Call Trackers)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF010B26),
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...warriors.map((u) => _buildUserCard(u)),
                        const SizedBox(height: 20),
                      ],
                      if (nonWarriors.isNotEmpty) ...[
                        const Text(
                          'Leaders & Administrators',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF010B26),
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...nonWarriors.map((u) => _buildUserCard(u)),
                      ],
                    ],
                  ),
      ),
    );
  }

  Widget _buildUserCard(dynamic user) {
    final String role = user['role'] ?? 'warrior';
    final String? systemId = user['system_id'];
    final String? employeeId = user['employee_id'];
    final bool isApproved = user['is_approved'] ?? false;
    final bool isActive = user['is_active'] ?? false;

    // Resolve manager name from the list
    String managerName = 'Unassigned';
    if (user['manager_id'] != null) {
      final manager = _users.firstWhere(
        (u) => u['id'].toString() == user['manager_id'].toString(),
        orElse: () => null,
      );
      if (manager != null) {
        managerName = manager['full_name'].toString();
      }
    }

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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    user['full_name'] ?? 'No Name',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF010B26),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: role == 'super_admin'
                        ? const Color(0xFFFFF4EB)
                        : role == 'admin'
                            ? const Color(0xFFFFF2F2)
                            : role == 'group_leader'
                                ? const Color(0xFFEBF5FF)
                                : const Color(0xFFEBF5EB),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    role == 'super_admin'
                        ? 'Super Admin'
                        : role == 'admin'
                            ? 'Admin'
                            : role == 'group_leader'
                                ? 'Leader'
                                : 'Warrior',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: role == 'super_admin'
                          ? Colors.orange
                          : role == 'admin'
                              ? Colors.redAccent
                              : role == 'group_leader'
                                  ? Colors.blueAccent
                                  : const Color(0xFF04693F),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              user['email'] ?? 'No Email',
              style: const TextStyle(fontSize: 13, color: Color(0xFF666666)),
            ),
            if (role == 'warrior') ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 14, color: Color(0xFF666666)),
                  const SizedBox(width: 4),
                  Text(
                    'Leader: $managerName',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF666666)),
                  ),
                ],
              ),
            ],
            if (systemId != null || employeeId != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.badge_outlined, size: 14, color: Color(0xFF666666)),
                  const SizedBox(width: 4),
                  Text(
                    'System ID: ${systemId ?? "—"}  •  Emp ID: ${employeeId ?? "—"}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                _buildStatusDot('Approved', isApproved),
                const SizedBox(width: 12),
                _buildStatusDot('Active', isActive),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFEEEEEE)),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => _showEditDialog(user),
                  icon: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF04693F)),
                  label: const Text('Edit / Reassign', style: TextStyle(color: Color(0xFF04693F), fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                if (user['id'].toString() != _currentUserId) ...[
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: () => _handleDelete(user['id'].toString(), user['full_name'].toString()),
                    icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                    label: const Text('Remove', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusDot(String label, bool state) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: state ? Colors.green : Colors.grey,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: state ? Colors.green[800] : Colors.grey[700],
          ),
        ),
      ],
    );
  }
}
