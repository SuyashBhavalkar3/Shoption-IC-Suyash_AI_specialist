import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiService {
  static String get baseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }
    // API_BASE_URL is not set in .env — crash loudly in debug, so it is never
    // silently misconfigured in a production build.
    assert(false, 'API_BASE_URL is not set in .env. Add it before building.');
    throw Exception('API_BASE_URL is not set in .env');
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<void> saveSession(String token, String role, String email, String name, String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
    await prefs.setString('user_role', role);
    await prefs.setString('user_email', email);
    await prefs.setString('user_name', name);
    await prefs.setString('user_id', userId);
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_role');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    await prefs.remove('user_id');
  }

  /// Calls POST /auth/logout then clears local session.
  /// Safe to call even if server is unreachable — local session is always cleared.
  static Future<void> logout() async {
    try {
      final url = Uri.parse('$baseUrl/auth/logout');
      await http.post(url, headers: await _headers());
    } catch (e) {
      debugPrint('Server logout acknowledgment failed (ignored): $e');
    } finally {
      await clearSession();
    }
  }

  static Future<Map<String, String>> _headers() async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await getToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<List<Map<String, dynamic>>> getOrganisations() async {
    final url = Uri.parse('$baseUrl/auth/organisations');
    final response = await http.get(
      url,
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } else {
      final errorDetail = _parseError(response.body);
      throw Exception(errorDetail);
    }
  }

  // ── Authentication ──

  static Future<Map<String, dynamic>> register({
    required String email,
    required String fullName,
    required String password,
    required String role,
    String? organisationId,
    String? organisationInviteCode,
  }) async {
    final url = Uri.parse('$baseUrl/auth/register');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'full_name': fullName,
        'password': password,
        'role': role,
        'organisation_id': organisationId,
        'organisation_invite_code': organisationInviteCode,
      }),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorDetail = _parseError(response.body);
      throw Exception(errorDetail);
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorDetail = _parseError(response.body);
      throw Exception(errorDetail);
    }
  }

  // ── Users ──

  static Future<Map<String, dynamic>> getMe() async {
    final url = Uri.parse('$baseUrl/users/me');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> updateMyTrackingActive(bool active) async {
    final url = Uri.parse('$baseUrl/users/me/tracking-active?active=$active');
    final response = await http.put(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> updateTrackingStatus({
    required String empId,
    required String organisationId,
    required String systemId,
    required bool isTrackingEnabled,
    required String lastActivityTimestamp,
  }) async {
    final url = Uri.parse('$baseUrl/users/track/status');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: jsonEncode({
        'emp_id': empId,
        'organisation_id': organisationId,
        'system_id': systemId,
        'is_tracking_enabled': isTrackingEnabled,
        'last_activity_timestamp': lastActivityTimestamp,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }


  static Future<List<dynamic>> getPendingUsers() async {
    final url = Uri.parse('$baseUrl/users/pending');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<List<dynamic>> getMyTeam() async {
    final url = Uri.parse('$baseUrl/users/my-team');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> approveUser({
    required String userId,
    String? leaderId,
  }) async {
    final url = Uri.parse('$baseUrl/users/approve');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: jsonEncode({
        'user_id': userId,
        'leader_id': leaderId,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }


  // ── Sync Calls ──

  static Future<List<dynamic>> syncCalls(List<Map<String, dynamic>> logs) async {
    final url = Uri.parse('$baseUrl/calls/');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: jsonEncode(logs),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<List<dynamic>> getMyCallLogs() async {
    final url = Uri.parse('$baseUrl/calls/');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  // ── Reports ──

  static Future<Map<String, dynamic>> getReports() async {
    final url = Uri.parse('$baseUrl/calls/reports');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  // ── Org Employees ──

  static Future<List<dynamic>> getOrgEmployees() async {
    final url = Uri.parse('$baseUrl/org-employees/');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> addOrgEmployee(String employeeId, String? email) async {
    final url = Uri.parse('$baseUrl/org-employees/');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: jsonEncode({
        'employee_id': employeeId,
        'email': email,
      }),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> bulkUploadOrgEmployees(List<Map<String, String>> employees) async {
    final url = Uri.parse('$baseUrl/org-employees/bulk-upload');
    final request = http.MultipartRequest('POST', url);
    
    final headers = await _headers();
    request.headers.addAll(headers);
    
    final buffer = StringBuffer();
    buffer.writeln('employee_id,email');
    for (final emp in employees) {
      buffer.writeln('${emp['employee_id']},${emp['email'] ?? ''}');
    }
    
    request.files.add(
      http.MultipartFile.fromString(
        'file',
        buffer.toString(),
        filename: 'employees.csv',
      ),
    );
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> uploadEmployeesFile(String filePath, String fileName) async {
    final url = Uri.parse('$baseUrl/org-employees/bulk-upload');
    final request = http.MultipartRequest('POST', url);
    
    final headers = await _headers();
    request.headers.addAll(headers);
    
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        filename: fileName,
      ),
    );
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> updateOrgEmployeeTrackingNeeded(String employeeId, bool needed) async {
    final url = Uri.parse('$baseUrl/org-employees/$employeeId/tracking-needed?needed=$needed');
    final response = await http.put(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static String _parseError(String body) {
    try {
      final parsed = jsonDecode(body);
      if (parsed is Map && parsed.containsKey('detail')) {
        return parsed['detail'].toString();
      }
    } catch (_) {}
    return 'An unexpected error occurred ($body)';
  }

  // ── Admin management endpoints ──

  static Future<List<dynamic>> getAllUsers() async {
    final url = Uri.parse('$baseUrl/users/');
    final response = await http.get(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> updateAdminUser(
    String userId, {
    String? fullName,
    String? email,
    String? role,
    String? managerId,
    bool? isActive,
    bool? isApproved,
    String? systemId,
  }) async {
    final url = Uri.parse('$baseUrl/users/$userId');
    final Map<String, dynamic> payload = {};
    if (fullName != null) payload['full_name'] = fullName;
    if (email != null) payload['email'] = email;
    if (role != null) payload['role'] = role;
    if (managerId != null) payload['manager_id'] = managerId == 'none' ? null : managerId;
    if (isActive != null) payload['is_active'] = isActive;
    if (isApproved != null) payload['is_approved'] = isApproved;
    if (systemId != null) payload['system_id'] = systemId.isEmpty ? null : systemId;

    final response = await http.put(
      url,
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }

  static Future<Map<String, dynamic>> deleteUser(String userId) async {
    final url = Uri.parse('$baseUrl/users/$userId');
    final response = await http.delete(url, headers: await _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(_parseError(response.body));
    }
  }
}

