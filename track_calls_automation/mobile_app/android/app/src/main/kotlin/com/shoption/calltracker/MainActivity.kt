package com.shoption.calltracker

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.shoption.calltracker/tracking"
    private val REQUEST_CODE_REQUIRED_PERMISSIONS = 4101
    private var pendingPermissionResult: MethodChannel.Result? = null

    companion object {
        var methodChannel: MethodChannel? = null
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                /**
                 * Requests READ_PHONE_STATE and READ_CALL_LOG permissions.
                 * Returns true if already granted, otherwise shows the system dialog.
                 */
                "requestRequiredPermissions" -> {
                    if (hasCallPermissions()) {
                        result.success(true)
                    } else {
                        pendingPermissionResult = result
                        ActivityCompat.requestPermissions(
                            this,
                            arrayOf(
                                Manifest.permission.READ_PHONE_STATE,
                                Manifest.permission.READ_CALL_LOG
                            ),
                            REQUEST_CODE_REQUIRED_PERMISSIONS
                        )
                    }
                }

                /**
                 * Starts (or keeps running) the CallTrackingService.
                 * Permissions must be granted before calling this.
                 * Returns true on success, false if permissions are missing.
                 */
                "ensureTracking" -> {
                    if (hasCallPermissions()) {
                        startCallTrackingService()
                        result.success(true)
                    } else {
                        result.success(false)
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Auto-start the tracking service every time the app comes to the foreground.
        // This is a no-op if the service is already running (START_STICKY keeps it alive).
        if (hasCallPermissions()) {
            startCallTrackingService()
        }
    }

    private fun startCallTrackingService() {
        val intent = Intent(this, CallTrackingService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun hasCallPermissions(): Boolean {
        return hasPermission(Manifest.permission.READ_PHONE_STATE) &&
               hasPermission(Manifest.permission.READ_CALL_LOG)
    }

    private fun hasPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQUEST_CODE_REQUIRED_PERMISSIONS) return

        val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        pendingPermissionResult?.success(allGranted)
        pendingPermissionResult = null

        // If permissions were just granted, start the service immediately.
        if (allGranted) {
            startCallTrackingService()
        }
    }

    override fun onDestroy() {
        methodChannel = null
        super.onDestroy()
    }
}
