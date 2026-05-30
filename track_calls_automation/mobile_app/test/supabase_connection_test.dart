import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  setUpAll(() async {
    // Initialize binding to allow mocking method channels
    TestWidgetsFlutterBinding.ensureInitialized();
    
    // Mock shared_preferences channel to return empty preferences
    const channel = MethodChannel('plugins.flutter.io/shared_preferences');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
      if (methodCall.method == 'getAll') {
        return <String, Object>{};
      }
      return null;
    });

    // Load .env using standard File IO for running tests on local machine
    var envFile = File('.env');
    if (!await envFile.exists()) {
      envFile = File('mobile_app/.env');
    }
    
    if (await envFile.exists()) {
      print('.env file found at: ${envFile.absolute.path}');
      final content = await envFile.readAsString();
      dotenv.testLoad(fileInput: content);
    } else {
      print('Warning: .env file NOT found!');
    }
  });

  test('Test Supabase Connection', () async {
    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';

    expect(supabaseUrl, isNotEmpty, reason: 'SUPABASE_URL must be defined in .env');
    expect(supabaseAnonKey, isNotEmpty, reason: 'SUPABASE_ANON_KEY must be defined in .env');

    print('Attempting to connect to Supabase: $supabaseUrl');

    try {
      // Force real HTTP calls (TestWidgetsFlutterBinding normally mocks them and returns 400)
      HttpOverrides.global = null;
      
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      final client = Supabase.instance.client;
      
      // Try to query the call_logs table
      final response = await client.from('call_logs').select().limit(1);
      
      print('Connection successful! Query response: $response');
      expect(response, isNotNull);
    } catch (e) {
      fail('Supabase connection failed with error: $e');
    }
  });
}

