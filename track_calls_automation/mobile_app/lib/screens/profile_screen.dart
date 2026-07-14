import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = '';
  String _userEmail = '';
  String _userRole = '';
  String _userId = '';
  String _empId = '';
  String _orgId = '';
  String _systemId = '';
  String _appVersion = '1.0.2';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    // Fetch fresh data from API in case cache is stale
    try {
      final user = await ApiService.getMe();
      await prefs.setString('user_name', user['full_name'] ?? '');
      await prefs.setString('user_email', user['email'] ?? '');
      await prefs.setString('user_role', user['role'] ?? '');
      if (user['employee_id'] != null) {
        await prefs.setString('user_emp_id', user['employee_id'].toString());
      }
      if (user['organisation_id'] != null) {
        await prefs.setString('user_org_id', user['organisation_id'].toString());
      }
      if (user['system_id'] != null) {
        await prefs.setString('user_system_id', user['system_id'].toString());
      }
    } catch (_) {
      // Use cached data if API fails
    }

    String version = 'rel-1.0.3';

    if (!mounted) return;
    setState(() {
      _userName = prefs.getString('user_name') ?? 'N/A';
      _userEmail = prefs.getString('user_email') ?? 'N/A';
      _userRole = prefs.getString('user_role') ?? 'N/A';
      _userId = prefs.getString('user_id') ?? 'N/A';
      _empId = prefs.getString('user_emp_id') ?? 'N/A';
      _orgId = prefs.getString('user_org_id') ?? 'N/A';
      _systemId = prefs.getString('user_system_id') ?? 'N/A';
      _appVersion = version;
      _isLoading = false;
    });
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Logout', style: TextStyle(color: Color(0xFFF8FAFC))),
        content: const Text(
          'Are you sure you want to log out?',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      // 1. Explicitly stop native tracking service first
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('tracking_toggled_active', false);
        const platform = MethodChannel('com.shoption.calltracker/tracking');
        await platform.invokeMethod('stopTracking');
        try {
          await ApiService.updateMyTrackingActive(false);
        } catch (_) {}
      } catch (e) {
        debugPrint('Error stopping native service on logout: $e');
      }

      // 2. Clear credentials and session on server
      await ApiService.logout();
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  String _getRoleLabel(String role) {
    switch (role.toLowerCase()) {
      case 'warrior':
        return 'Employee (Call Tracking Agent)';
      case 'group_leader':
        return 'Group Leader';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role;
    }
  }

  Color _getRoleBadgeColor(String role) {
    switch (role.toLowerCase()) {
      case 'warrior':
        return const Color(0xFF00E6B8);
      case 'group_leader':
        return const Color(0xFF1F8FFF);
      case 'admin':
        return const Color(0xFF8B5CF6);
      case 'super_admin':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty || name.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF050816),
      child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1F8FFF)))
          : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const SizedBox(height: 8),
  
                    // Avatar + Name + Role badge
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0E1528),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
                      ),
                      child: Column(
                        children: [
                          // Avatar circle
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1F8FFF), Color(0xFF0A5FBA)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF1F8FFF).withOpacity(0.3),
                                  blurRadius: 16,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                _getInitials(_userName),
                                style: const TextStyle(
                                  fontSize: 30,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _userName,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFF8FAFC),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          // Role badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getRoleBadgeColor(_userRole).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _getRoleBadgeColor(_userRole).withOpacity(0.5),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.verified_rounded,
                                  size: 13,
                                  color: _getRoleBadgeColor(_userRole),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _getRoleLabel(_userRole),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: _getRoleBadgeColor(_userRole),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
  
                    const SizedBox(height: 16),
  
                    // Info cards
                    _buildInfoCard([
                      _buildInfoRow(Icons.email_outlined, 'Email Address', _userEmail, copyable: true),
                      _buildDivider(),
                      _buildInfoRow(Icons.fingerprint_rounded, 'User ID', _userId, copyable: true),
                    ]),
  
                    const SizedBox(height: 12),
  
                    _buildInfoCard([
                      _buildInfoRow(Icons.badge_outlined, 'Employee ID', _empId.isEmpty || _empId == 'N/A' ? 'Not assigned' : _empId),
                      _buildDivider(),
                      _buildInfoRow(Icons.business_outlined, 'Organisation ID', _orgId.isEmpty || _orgId == 'N/A' ? 'Not assigned' : _orgId, copyable: true),
                      _buildDivider(),
                      _buildInfoRow(Icons.devices_rounded, 'System ID', _systemId.isEmpty || _systemId == 'N/A' ? 'Not assigned' : _systemId, copyable: true),
                    ]),
  
                    const SizedBox(height: 32),
  
                    // Logout button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout_rounded, size: 18),
                        label: const Text(
                          'Sign Out',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFE11D48),
                          side: const BorderSide(color: Color(0xFFE11D48), width: 1.5),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'App Version $_appVersion',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1528),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, thickness: 1, color: Color(0xFF1E293B));
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool copyable = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFF1F8FFF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: const Color(0xFF1F8FFF)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFFF8FAFC),
                  ),
                ),
              ],
            ),
          ),
          if (copyable && value != 'N/A' && value != 'Not assigned')
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$label copied'),
                    backgroundColor: const Color(0xFF0E1528),
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              child: const Icon(
                Icons.copy_rounded,
                size: 16,
                color: Color(0xFF94A3B8),
              ),
            ),
        ],
      ),
    );
  }
}
