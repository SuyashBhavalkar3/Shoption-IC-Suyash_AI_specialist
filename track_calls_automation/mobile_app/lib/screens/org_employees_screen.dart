import 'package:flutter/material.dart';
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

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Error', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFF010B26))),
          ),
        ],
      ),
    );
  }

  void _showBulkResultDialog(int created, int skipped, List<dynamic> skippedDetails) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Upload Summary', style: TextStyle(color: Color(0xFF010B26), fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Successfully Created: $created', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
              Text('Skipped / Ignored: $skipped', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
              if (skippedDetails.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Skipped Details:', style: TextStyle(fontWeight: FontWeight.bold)),
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
                          style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
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
            child: const Text('OK', style: TextStyle(color: Color(0xFF010B26))),
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
        backgroundColor: Colors.white,
        title: const Text('Add Single Employee', style: TextStyle(color: Color(0xFF010B26), fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: empIdController,
              decoration: const InputDecoration(
                labelText: 'Employee ID',
                hintText: 'Enter company employee ID',
                border: OutlineInputBorder(),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF04693F), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address',
                hintText: 'Enter employee email address',
                border: OutlineInputBorder(),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF04693F), width: 1.5),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF666666))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleAddSingle(empIdController.text, emailController.text);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF04693F),
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
        backgroundColor: Colors.white,
        title: const Text('Bulk Add Employees', style: TextStyle(color: Color(0xFF010B26), fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: MediaQuery.of(context).size.width * 0.8,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter "Employee ID, Email" (one per line):',
                style: TextStyle(color: Color(0xFF666666), fontSize: 13),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: controller,
                maxLines: 8,
                decoration: const InputDecoration(
                  hintText: 'EMP-101, employee1@mail.com\nEMP-102, employee2@mail.com\nEMP-103',
                  border: OutlineInputBorder(),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF04693F), width: 1.5),
                  ),
                ),
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
              backgroundColor: const Color(0xFF04693F),
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
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.person_add_alt_1, color: Color(0xFF04693F)),
                title: const Text('Add Single Employee'),
                subtitle: const Text('Manually enter employee ID and email'),
                onTap: () {
                  Navigator.pop(context);
                  _showAddSingleDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.playlist_add, color: Color(0xFF04693F)),
                title: const Text('Bulk Add Employees'),
                subtitle: const Text('Enter multiple IDs and emails (comma separated)'),
                onTap: () {
                  Navigator.pop(context);
                  _showBulkAddDialog();
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const ShoptionAppBar(
        title: 'Registry',
        subtitle: 'Employee Mapping',
      ),
      body: RefreshIndicator(
        onRefresh: _fetchEmployees,
        color: const Color(0xFF04693F),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search Employee ID / Email / System ID...',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF666666)),
                  filled: true,
                  fillColor: const Color(0xFFF9F9F9),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFFEEEEEE)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF04693F), width: 1.5),
                  ),
                ),
              ),
            ),
            Expanded(
              child: _isLoading && _employees.isEmpty
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
                              onPressed: _fetchEmployees,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF010B26),
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
                                      const Icon(Icons.badge_outlined, size: 60, color: Color(0xFF666666)),
                                      const SizedBox(height: 16),
                                      const Text(
                                        'No Employees Found',
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF010B26)),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _searchController.text.isNotEmpty
                                            ? 'Try a different search query.'
                                            : 'Add employees to get started.',
                                        style: const TextStyle(color: Color(0xFF666666)),
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
                                        const CircleAvatar(
                                          backgroundColor: Color(0xFFEEEEEE),
                                          foregroundColor: Color(0xFF010B26),
                                          child: Icon(Icons.badge),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Emp ID: ${emp['employee_id']}',
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF010B26)),
                                              ),
                                              if (emp['email'] != null && emp['email'].toString().isNotEmpty) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  'Email: ${emp['email']}',
                                                  style: const TextStyle(color: Color(0xFF666666), fontSize: 13),
                                                ),
                                              ],
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  const Text('System ID: ', style: TextStyle(color: Color(0xFF666666), fontSize: 13)),
                                                  Text(
                                                    '${emp['system_id']}',
                                                    style: const TextStyle(color: Color(0xFF04693F), fontWeight: FontWeight.bold, fontSize: 13),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
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
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showOptionsBottomSheet,
        backgroundColor: const Color(0xFF04693F),
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }
}
