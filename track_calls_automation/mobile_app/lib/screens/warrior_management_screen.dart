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
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCurrentUserId();
    _loadData();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase().trim();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String? _currentUserRole;

  Future<void> _loadCurrentUserId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _currentUserId = prefs.getString('user_id');
      _currentUserRole = prefs.getString('user_role');
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
    return _users.where((u) {
      final role = u['role']?.toString().toLowerCase();
      final isApproved = u['is_approved'] == true;
      if (!isApproved) return false;
      
      if (role == 'group_leader') return true;
      if (role == 'admin' || role == 'super_admin') {
        // If they are admin but also acting as group leader (i.e. some user has their ID as manager_id)
        final userId = u['id']?.toString().toLowerCase();
        return _users.any((other) => other['manager_id']?.toString().toLowerCase() == userId);
      }
      return false;
    }).toList();
  }

  Future<void> _handleDelete(String userId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Delete User', style: TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to permanently delete $name? This action cannot be undone.', style: const TextStyle(color: Color(0xFF94A3B8))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE11D48),
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
          SnackBar(content: Text('Successfully deleted $name'), backgroundColor: const Color(0xFF00E6B8)),
        );
        _loadData();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e'), backgroundColor: const Color(0xFFE11D48)),
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
              backgroundColor: const Color(0xFF0E1528),
              title: Text('Edit User: ${user['full_name']}', style: const TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: fullNameController,
                      style: const TextStyle(color: Color(0xFFF8FAFC)),
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1F8FFF))),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: emailController,
                      style: const TextStyle(color: Color(0xFFF8FAFC)),
                      decoration: const InputDecoration(
                        labelText: 'Email Address',
                        labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1F8FFF))),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: systemIdController,
                      style: const TextStyle(color: Color(0xFFF8FAFC)),
                      decoration: const InputDecoration(
                        labelText: 'System ID (6-digit mapping)',
                        labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1F8FFF))),
                      ),
                      maxLength: 6,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: selectedRole,
                      dropdownColor: const Color(0xFF0E1528),
                      decoration: const InputDecoration(
                        labelText: 'Role',
                        labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'warrior', child: Text('Employee', style: TextStyle(color: Color(0xFFF8FAFC)))),
                        DropdownMenuItem(value: 'group_leader', child: Text('Group Leader', style: TextStyle(color: Color(0xFFF8FAFC)))),
                        DropdownMenuItem(value: 'admin', child: Text('Admin', style: TextStyle(color: Color(0xFFF8FAFC)))),
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
                        dropdownColor: const Color(0xFF0E1528),
                        decoration: const InputDecoration(
                          labelText: 'Group Leader (Manager)',
                          labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                        ),
                        items: [
                          const DropdownMenuItem(value: 'none', child: Text('Unassigned (None)', style: TextStyle(color: Color(0xFFF8FAFC)))),
                          ...leaders.map((l) => DropdownMenuItem(
                                value: l['id'].toString(),
                                child: Text(l['full_name'].toString(), style: const TextStyle(color: Color(0xFFF8FAFC))),
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
                      title: const Text('Active Account', style: TextStyle(fontSize: 14, color: Color(0xFFF8FAFC))),
                      value: isActive,
                      activeColor: const Color(0xFF00E6B8),
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        setDialogState(() {
                          isActive = val;
                        });
                      },
                    ),
                    SwitchListTile(
                      title: const Text('Approved Login', style: TextStyle(fontSize: 14, color: Color(0xFFF8FAFC))),
                      value: isApproved,
                      activeColor: const Color(0xFF00E6B8),
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
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
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
                        const SnackBar(content: Text('Successfully updated user info'), backgroundColor: Color(0xFF00E6B8)),
                      );
                      _loadData();
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Update failed: $e'), backgroundColor: const Color(0xFFE11D48)),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1F8FFF),
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
    // Filter by role hierarchy: admin sees only group_leader, warrior, themselves, and other admins who are managers
    final baseFiltered = _users.where((u) {
      if (_currentUserRole == 'admin') {
        final role = u['role']?.toString().toLowerCase();
        final userId = u['id']?.toString().toLowerCase();
        final currentUid = _currentUserId?.toLowerCase();
        
        // Let them see themselves
        if (userId == currentUid) return true;
        
        // If target is admin or super_admin, we only show them if they are active managers
        // (i.e. some user in the system has their ID as manager_id)
        if (role == 'admin' || role == 'super_admin') {
          final isManager = _users.any((other) => other['manager_id']?.toString().toLowerCase() == userId);
          return isManager;
        }
      }
      return true;
    }).toList();

    // Filter users list based on query
    final filteredUsers = baseFiltered.where((u) {
      if (_searchQuery.isEmpty) return true;
      final name = (u['full_name'] ?? '').toString().toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      final role = (u['role'] ?? '').toString().toLowerCase();
      final sysId = (u['system_id'] ?? '').toString().toLowerCase();
      final empId = (u['employee_id'] ?? '').toString().toLowerCase();
      
      return name.contains(_searchQuery) ||
          email.contains(_searchQuery) ||
          role.contains(_searchQuery) ||
          sysId.contains(_searchQuery) ||
          empId.contains(_searchQuery);
    }).toList();

    // Separate warriors for better UI organization
    final warriors = filteredUsers.where((u) => u['role'] == 'warrior').toList();
    final nonWarriors = filteredUsers.where((u) => u['role'] != 'warrior').toList();

    return RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF1F8FFF),
        child: _isLoading
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
                        onPressed: _loadData,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1F8FFF)),
                        child: const Text('Retry', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  )
                 : Column(
                     children: [
                       Padding(
                         padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                         child: TextField(
                           controller: _searchController,
                           style: const TextStyle(color: Color(0xFFF8FAFC)),
                           decoration: InputDecoration(
                             hintText: 'Search by name, email, role, or ID...',
                             hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                             prefixIcon: const Icon(Icons.search, color: Color(0xFF1F8FFF), size: 20),
                             filled: true,
                             fillColor: const Color(0xFF0E1528),
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
                         ),
                       ),
                       Expanded(
                         child: ListView(
                           padding: const EdgeInsets.all(16),
                           children: [
                             if (warriors.isNotEmpty) ...[
                               const Text(
                                 'Employees (Call Trackers)',
                                 style: TextStyle(
                                   fontSize: 16,
                                   fontWeight: FontWeight.bold,
                                   color: Color(0xFFF8FAFC),
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
                                   color: Color(0xFFF8FAFC),
                                 ),
                               ),
                               const SizedBox(height: 10),
                               ...nonWarriors.map((u) => _buildUserCard(u)),
                             ],
                             if (warriors.isEmpty && nonWarriors.isEmpty)
                               const Padding(
                                 padding: EdgeInsets.symmetric(vertical: 40.0),
                                 child: Center(
                                   child: Text(
                                     'No users match your search query.',
                                     style: TextStyle(color: Color(0xFF94A3B8)),
                                   ),
                                 ),
                               ),
                           ],
                         ),
                       ),
                     ],
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
      color: const Color(0xFF0E1528),
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFF1E293B)),
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
                      color: Color(0xFFF8FAFC),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: role == 'super_admin'
                        ? const Color(0xFF8B5CF6).withOpacity(0.15)
                        : role == 'admin'
                            ? const Color(0xFFE11D48).withOpacity(0.15)
                            : role == 'group_leader'
                                ? const Color(0xFF1F8FFF).withOpacity(0.15)
                                : const Color(0xFF00E6B8).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    role == 'super_admin'
                        ? 'Super Admin'
                        : role == 'admin'
                            ? 'Admin'
                            : role == 'group_leader'
                                ? 'Leader'
                                : 'Employee',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: role == 'super_admin'
                          ? const Color(0xFF8B5CF6)
                          : role == 'admin'
                              ? const Color(0xFFE11D48)
                              : role == 'group_leader'
                                  ? const Color(0xFF1F8FFF)
                                  : const Color(0xFF00E6B8),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              user['email'] ?? 'No Email',
              style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),
            if (role == 'warrior') ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Text(
                    'Leader: $managerName',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ],
            if (systemId != null || employeeId != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.badge_outlined, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Text(
                    'System ID: ${systemId ?? "—"}  •  Emp ID: ${employeeId ?? "—"}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
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
            const Divider(height: 24, color: Color(0xFF1E293B)),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => _showEditDialog(user),
                  icon: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF1F8FFF)),
                  label: const Text('Edit / Reassign', style: TextStyle(color: Color(0xFF1F8FFF), fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                if (user['id'].toString() != _currentUserId) ...[
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: () => _handleDelete(user['id'].toString(), user['full_name'].toString()),
                    icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFE11D48)),
                    label: const Text('Remove', style: TextStyle(color: Color(0xFFE11D48), fontSize: 13, fontWeight: FontWeight.bold)),
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
