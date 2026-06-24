import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:googleapis_auth/auth_io.dart';
import 'package:package_info_plus/package_info_plus.dart';

final versionCheckProvider = StreamProvider<bool>((ref) async* {
  final scopes = ['https://www.googleapis.com/auth/firebase.remoteconfig'];

  Future<String> fetchRemoteConfigValue(String key) async {
    try {
      final jsonString = await rootBundle.loadString('assets/google-services.json');
      final credentials = ServiceAccountCredentials.fromJson(jsonString);
      final client = await clientViaServiceAccount(credentials, scopes);
      
      final response = await client.get(Uri.parse(
        'https://firebaseremoteconfig.googleapis.com/v1/projects/shoption-af244/remoteConfig'
      ));
      
      client.close();
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final parameters = data['parameters'] as Map<String, dynamic>?;
        final param = parameters?[key] as Map<String, dynamic>?;
        final defaultValue = param?['defaultValue'] as Map<String, dynamic>?;
        final value = defaultValue?['value']?.toString() ?? "";
        return value;
      } else {
        debugPrint('⚠️ Remote Config REST failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('⚠️ Error fetching Remote Config via service account: $e');
    }
    return "";
  }

  Future<bool> isUpdateNeeded() async {
    PackageInfo packageInfo = await PackageInfo.fromPlatform();
    String currentVersion = packageInfo.version;
    String remoteKey = "lead_lens_android";
    String remoteVersion = await fetchRemoteConfigValue(remoteKey);
    debugPrint('ℹ️ Remote Config REST check: currentVersion=$currentVersion, remoteVersion=$remoteVersion');
    return remoteVersion.isNotEmpty && remoteVersion != currentVersion;
  }

  yield await isUpdateNeeded();

  // Poll every 10 seconds to get updates in real-time
  final controller = StreamController<bool>();
  final timer = Timer.periodic(const Duration(seconds: 10), (_) async {
    final needsUpdate = await isUpdateNeeded();
    if (!controller.isClosed) {
      controller.add(needsUpdate);
    }
  });

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  yield* controller.stream;
});
