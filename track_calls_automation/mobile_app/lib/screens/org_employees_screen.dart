import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../widgets/shoption_app_bar.dart';

class OrgEmployeesScreen extends StatefulWidget {
  const OrgEmployeesScreen({super.key});

  @override
  State<OrgEmployeesScreen> createState() => _OrgEmployeesScreenState();
}

class _OrgEmployeesScreenState extends State<OrgEmployeesScreen> {
  List<dynamic> _employees = [];
  List<dynamic> _filteredEmployees = [];
  bool _isLoading = true;
  String? _errorMessage;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchEmployees();
    _searchController.addListener(_filterEmployees);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchEmployees() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final employees = await ApiService.getOrgEmployees();
      setState(() {
        _employees = employees;
        _filteredEmployees = employees;
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

  void _filterEmployees() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      if (query.isEmpty) {
        _filteredEmployees = _employees;
      } else {
        _filteredEmployees = _employees.where((emp) {
          final empId = emp['employee_id'].toString().toLowerCase();
          final sysId = emp['system_id'].toString().toLowerCase();
          final email = (emp['email'] ?? '').toString().toLowerCase();
          return empId.contains(query) || sysId.contains(query) || email.contains(query);
        }).toList();
      }
    });
  }

  Future<void> _toggleTrackingNeeded(String employeeId, bool newValue) async {
    setState(() {
      _isLoading = true;
    });
    try {
      await ApiService.updateOrgEmployeeTrackingNeeded(employeeId, newValue);
      // Update local state without fetching all again to prevent layout reset
      setState(() {
        final idx = _employees.indexWhere((element) => element['employee_id'] == employeeId);
        if (idx != -1) {
          _employees[idx]['is_tracking_needed'] = newValue;
        }
        final fIdx = _filteredEmployees.indexWhere((element) => element['employee_id'] == employeeId);
        if (fIdx != -1) {
          _filteredEmployees[fIdx]['is_tracking_needed'] = newValue;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newValue
                  ? 'Tracking enabled for employee "$employeeId"'
                  : 'Tracking disabled for employee "$employeeId"',
            ),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      _showErrorDialog(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleAddSingle(String employeeId, String? email) async {
    final cleanId = employeeId.trim();
    final cleanEmail = email?.trim();
    if (cleanId.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await ApiService.addOrgEmployee(cleanId, cleanEmail != null && cleanEmail.isEmpty ? null : cleanEmail);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Employee "$cleanId" added successfully!')),
        );
      }
      _fetchEmployees();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _handleBulkUpload(List<Map<String, String>> employees) async {
    if (employees.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.bulkUploadOrgEmployees(employees);
      final created = result['created'] ?? 0;
      final skipped = result['skipped'] ?? 0;
      final List<dynamic> details = result['skipped_details'] ?? [];

      if (mounted) {
        _showBulkResultDialog(created, skipped, details);
      }
      _fetchEmployees();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _handleFilePicker() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'xlsx', 'xls', 'tsv', 'txt', 'json'],
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        final fileName = result.files.single.name;

        setState(() {
          _isLoading = true;
        });

        final uploadResult = await ApiService.uploadEmployeesFile(filePath, fileName);
        final created = uploadResult['created'] ?? 0;
        final skipped = uploadResult['skipped'] ?? 0;
        final List<dynamic> details = uploadResult['skipped_details'] ?? [];

        if (mounted) {
          _showBulkResultDialog(created, skipped, details);
        }
        _fetchEmployees();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Error', style: TextStyle(color: Color(0xFFFDA4AF), fontWeight: FontWeight.bold)),
        content: Text(message, style: const TextStyle(color: Color(0xFF94A3B8))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFF1F8FFF))),
          ),
        ],
      ),
    );
  }

  void _showBulkResultDialog(int created, int skipped, List<dynamic> skippedDetails) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Upload Summary', style: TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Successfully Created: $created', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E6B8))),
              Text('Skipped / Ignored: $skipped', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF8B5CF6))),
              if (skippedDetails.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Skipped Details:', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC))),
                const SizedBox(height: 6),
                Expanded(
                  child: ListView.builder(
                    itemCount: skippedDetails.length,
                    itemBuilder: (context, index) {
                      final item = skippedDetails[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          '• ${item['employee_id']}: ${item['reason']}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFF1F8FFF))),
          ),
        ],
      ),
    );
  }

  void _showAddSingleDialog() {
    final empIdController = TextEditingController();
    final emailController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Add Single Employee', style: TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: empIdController,
              style: const TextStyle(color: Color(0xFFF8FAFC)),
              decoration: const InputDecoration(
                labelText: 'Employee ID',
                labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                hintText: 'Enter company employee ID',
                hintStyle: TextStyle(color: Colors.grey),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF1F8FFF), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: Color(0xFFF8FAFC)),
              decoration: const InputDecoration(
                labelText: 'Email Address',
                labelStyle: TextStyle(color: Color(0xFF1F8FFF)),
                hintText: 'Enter employee email address',
                hintStyle: TextStyle(color: Colors.grey),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF1F8FFF), width: 1.5),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleAddSingle(empIdController.text, emailController.text);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1F8FFF),
              foregroundColor: Colors.white,
            ),
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _showBulkAddDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E1528),
        title: const Text('Bulk Add Employees', style: TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: MediaQuery.of(context).size.width * 0.8,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter "Employee ID, Email" (one per line):',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: controller,
                maxLines: 8,
                style: const TextStyle(color: Color(0xFFF8FAFC)),
                decoration: const InputDecoration(
                  hintText: 'EMP-101, employee1@mail.com\nEMP-102, employee2@mail.com\nEMP-103',
                  hintStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E293B))),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF1F8FFF), width: 1.5),
                  ),
                ),
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
            onPressed: () {
              final lines = controller.text.split('\n');
              final List<Map<String, String>> employees = [];
              for (final line in lines) {
                final parts = line.split(',');
                if (parts.isNotEmpty) {
                  final empId = parts[0].trim();
                  if (empId.isNotEmpty) {
                    final email = parts.length > 1 ? parts[1].trim() : '';
                    employees.add({'employee_id': empId, 'email': email});
                  }
                }
              }
              Navigator.pop(context);
              _handleBulkUpload(employees);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1F8FFF),
              foregroundColor: Colors.white,
            ),
            child: const Text('Upload'),
          ),
        ],
      ),
    );
  }

  void _showOptionsBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0E1528),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        side: BorderSide(color: Color(0xFF1E293B), width: 1),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16.0),
                child: Text(
                  'Add Employees',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                ),
              ),
              const Divider(height: 1, color: Color(0xFF1E293B)),
              ListTile(
                leading: const Icon(Icons.person_add_alt_1, color: Color(0xFF1F8FFF)),
                title: const Text('Add Single Employee', style: TextStyle(color: Color(0xFFF8FAFC))),
                subtitle: const Text('Manually enter employee ID and email', style: TextStyle(color: Color(0xFF94A3B8))),
                onTap: () {
                  Navigator.pop(context);
                  _showAddSingleDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.playlist_add, color: Color(0xFF1F8FFF)),
                title: const Text('Bulk Add Employees (Manual)', style: TextStyle(color: Color(0xFFF8FAFC))),
                subtitle: const Text('Enter multiple IDs and emails (comma separated)', style: TextStyle(color: Color(0xFF94A3B8))),
                onTap: () {
                  Navigator.pop(context);
                  _showBulkAddDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.upload_file, color: Color(0xFF1F8FFF)),
                title: const Text('Upload Employee File', style: TextStyle(color: Color(0xFFF8FAFC))),
                subtitle: const Text('Select a .csv, .xlsx, .xls, .tsv, .txt, or .json file', style: TextStyle(color: Color(0xFF94A3B8))),
                onTap: () {
                  Navigator.pop(context);
                  _handleFilePicker();
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
        onRefresh: _fetchEmployees,
        color: const Color(0xFF1F8FFF),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Color(0xFFF8FAFC)),
                decoration: InputDecoration(
                  hintText: 'Search Employee ID / Email / System ID...',
                  hintStyle: const TextStyle(color: Colors.grey),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                  filled: true,
                  fillColor: const Color(0xFF0E1528),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF1F8FFF), width: 1.5),
                  ),
                ),
              ),
            ),
            Expanded(
              child: _isLoading && _employees.isEmpty
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
                              onPressed: _fetchEmployees,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1F8FFF),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Retry'),
                            ),
                          ],
                        )
                      : _filteredEmployees.isEmpty
                          ? ListView(
                              children: [
                                SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                                Center(
                                  child: Column(
                                    children: [
                                      const Icon(Icons.badge_outlined, size: 60, color: Color(0xFF94A3B8)),
                                      const SizedBox(height: 16),
                                      const Text(
                                        'No Employees Found',
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _searchController.text.isNotEmpty
                                            ? 'Try a different search query.'
                                            : 'Add employees to get started.',
                                        style: const TextStyle(color: Color(0xFF94A3B8)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _filteredEmployees.length,
                              itemBuilder: (context, index) {
                                final emp = _filteredEmployees[index];
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
                                    child: Row(
                                      children: [
                                        const CircleAvatar(
                                          backgroundColor: Color(0xFF1E293B),
                                          foregroundColor: Color(0xFF1F8FFF),
                                          child: Icon(Icons.badge),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Emp ID: ${emp['employee_id']}',
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFFF8FAFC)),
                                              ),
                                              if (emp['email'] != null && emp['email'].toString().isNotEmpty) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  'Email: ${emp['email']}',
                                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                                ),
                                              ],
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  const Text('System ID: ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                                                  Text(
                                                    '${emp['system_id']}',
                                                    style: const TextStyle(color: Color(0xFF1F8FFF), fontWeight: FontWeight.bold, fontSize: 13),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              'Track Calls',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: (emp['is_tracking_needed'] ?? true) ? const Color(0xFF00E6B8) : const Color(0xFF94A3B8),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            SizedBox(
                                              height: 36,
                                              child: Switch(
                                                value: emp['is_tracking_needed'] ?? true,
                                                activeColor: const Color(0xFF00E6B8),
                                                activeTrackColor: const Color(0xFF00E6B8).withOpacity(0.2),
                                                inactiveThumbColor: const Color(0xFF94A3B8),
                                                inactiveTrackColor: const Color(0xFF1E293B),
                                                onChanged: (bool value) {
                                                  _toggleTrackingNeeded(emp['employee_id'], value);
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      );
  }
}
