import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  static String get baseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }
    // Fallback default
    return kIsWeb ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
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

  // ── Authentication ──

  static Future<Map<String, dynamic>> register({
    required String email,
    required String fullName,
    required String password,
    required String role,
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

  static String _parseError(String body) {
    try {
      final parsed = jsonDecode(body);
      if (parsed is Map && parsed.containsKey('detail')) {
        return parsed['detail'].toString();
      }
    } catch (_) {}
    return 'An unexpected error occurred ($body)';
  }
}
