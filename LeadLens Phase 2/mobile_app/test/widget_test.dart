import 'package:flutter_test/flutter_test.dart';
import 'package:shoption_call_tracker/main.dart';

void main() {
  testWidgets('Call Tracker App Instantiates', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    const app = CallTrackerApp();
    expect(app, isNotNull);
  });
}
