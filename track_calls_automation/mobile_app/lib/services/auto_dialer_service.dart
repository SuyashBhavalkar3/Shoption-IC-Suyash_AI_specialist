import 'dart:async';
import 'package:flutter/services.dart';

class AutoDialerService {
  static const MethodChannel _channel = MethodChannel('com.shoption.calltracker/autodialer');
  static const EventChannel _eventChannel = EventChannel('com.shoption.calltracker/autodialer_events');

  static Stream<Map<String, dynamic>>? _eventStream;

  static Stream<Map<String, dynamic>> get eventStream {
    _eventStream ??= _eventChannel
        .receiveBroadcastStream()
        .map((dynamic event) => Map<String, dynamic>.from(event as Map));
    return _eventStream!;
  }

  static Future<bool> isDefaultDialer() async {
    try {
      final bool result = await _channel.invokeMethod('isDefaultDialer');
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestDefaultDialer() async {
    try {
      const MethodChannel trackingChannel = MethodChannel('com.shoption.calltracker/tracking');
      final bool result = await trackingChannel.invokeMethod('requestDefaultDialer');
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<List<Map<String, dynamic>>> getSimCards() async {
    try {
      final List<dynamic> result = await _channel.invokeMethod('getSimCards');
      return result.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> loadDemoLeads({String campaignId = 'pune_leads'}) async {
    try {
      await _channel.invokeMethod('loadDemoLeads', {'campaignId': campaignId});
    } catch (_) {}
  }

  static Future<bool> dialCustomNumber(String phoneNumber, {int selectedSimSlot = 0}) async {
    try {
      final bool result = await _channel.invokeMethod('dialCustomNumber', {
        'phoneNumber': phoneNumber,
        'selectedSimSlot': selectedSimSlot,
      });
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<void> resetCampaign({String campaignId = 'pune_leads'}) async {
    try {
      await _channel.invokeMethod('resetCampaign', {'campaignId': campaignId});
    } catch (_) {}
  }

  static Future<void> startAutoDialer({
    String campaignId = 'pune_leads',
    int selectedSimSlot = 0,
    int delaySeconds = 2,
  }) async {
    try {
      await _channel.invokeMethod('startAutoDialer', {
        'campaignId': campaignId,
        'selectedSimSlot': selectedSimSlot,
        'delaySeconds': delaySeconds,
      });
    } catch (_) {}
  }

  static Future<void> pauseAutoDialer() async {
    try {
      await _channel.invokeMethod('pauseAutoDialer');
    } catch (_) {}
  }

  static Future<void> resumeAutoDialer() async {
    try {
      await _channel.invokeMethod('resumeAutoDialer');
    } catch (_) {}
  }

  static Future<void> skipCurrentLead() async {
    try {
      await _channel.invokeMethod('skipCurrentLead');
    } catch (_) {}
  }

  static Future<void> setMute(bool muted) async {
    try {
      await _channel.invokeMethod('setMute', {'muted': muted});
    } catch (_) {}
  }

  static Future<void> setSpeakerphone(bool speakerOn) async {
    try {
      await _channel.invokeMethod('setSpeakerphone', {'speakerOn': speakerOn});
    } catch (_) {}
  }

  static Future<void> toggleHold() async {
    try {
      await _channel.invokeMethod('toggleHold');
    } catch (_) {}
  }

  static Future<bool> startRecording() async {
    try {
      final bool result = await _channel.invokeMethod('startRecording');
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<String> stopRecording() async {
    try {
      final String result = await _channel.invokeMethod('stopRecording');
      return result;
    } catch (_) {
      return '';
    }
  }

  static Future<bool> toggleRecording() async {
    try {
      final bool result = await _channel.invokeMethod('toggleRecording');
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> playRecording(String path) async {
    try {
      final bool result = await _channel.invokeMethod('playRecording', {'path': path});
      return result;
    } catch (_) {
      return false;
    }
  }

  static Future<void> playDtmf(String digit) async {
    try {
      await _channel.invokeMethod('playDtmf', {'digit': digit});
    } catch (_) {}
  }

  static Future<void> endCurrentCall() async {
    try {
      await _channel.invokeMethod('endCurrentCall');
    } catch (_) {}
  }

  static Future<void> stopCampaign() async {
    try {
      await _channel.invokeMethod('stopCampaign');
    } catch (_) {}
  }

  static Future<List<Map<String, dynamic>>> getCallHistory({String campaignId = 'pune_leads'}) async {
    try {
      final List<dynamic> result = await _channel.invokeMethod('getCallHistory', {'campaignId': campaignId});
      return result.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> getCampaignStats({String campaignId = 'pune_leads'}) async {
    try {
      final dynamic result = await _channel.invokeMethod('getCampaignStats', {'campaignId': campaignId});
      return Map<String, dynamic>.from(result as Map);
    } catch (_) {
      return {
        'total': 0,
        'completed': 0,
        'noAnswer': 0,
        'busy': 0,
        'failed': 0,
        'skipped': 0,
        'remaining': 0,
      };
    }
  }
}
