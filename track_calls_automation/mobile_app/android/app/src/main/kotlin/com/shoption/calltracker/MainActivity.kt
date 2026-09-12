package com.shoption.calltracker

import android.Manifest
import android.content.Context
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
    private val REQUEST_CODE_SET_DEFAULT_DIALER = 4102
    private var pendingPermissionResult: MethodChannel.Result? = null
    private var pendingRoleResult: MethodChannel.Result? = null

    private lateinit var autoDialerManager: com.shoption.calltracker.autodialer.AutoDialerManager
    private lateinit var autoDialerPlugin: com.shoption.calltracker.telecom.AutoDialerPlugin

    companion object {
        var methodChannel: MethodChannel? = null
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        autoDialerManager = com.shoption.calltracker.autodialer.AutoDialerManager(applicationContext)
        autoDialerPlugin = com.shoption.calltracker.telecom.AutoDialerPlugin(applicationContext, autoDialerManager)
        autoDialerPlugin.registerWith(flutterEngine)

        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "requestDefaultDialer" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val roleManager = getSystemService(Context.ROLE_SERVICE) as android.app.role.RoleManager
                        if (roleManager.isRoleHeld(android.app.role.RoleManager.ROLE_DIALER)) {
                            result.success(true)
                        } else {
                            pendingRoleResult = result
                            val intent = roleManager.createRequestRoleIntent(android.app.role.RoleManager.ROLE_DIALER)
                            startActivityForResult(intent, REQUEST_CODE_SET_DEFAULT_DIALER)
                        }
                    } else {
                        val telecomManager = getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
                        if (telecomManager.defaultDialerPackage == packageName) {
                            result.success(true)
                        } else {
                            pendingRoleResult = result
                            val intent = Intent(android.telecom.TelecomManager.ACTION_CHANGE_DEFAULT_DIALER).apply {
                                putExtra(android.telecom.TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
                            }
                            startActivityForResult(intent, REQUEST_CODE_SET_DEFAULT_DIALER)
                        }
                    }
                }

                /**
                 * Requests READ_PHONE_STATE and READ_CALL_LOG permissions.
                 * Returns true if already granted, otherwise shows the system dialog.
                 */
                "requestRequiredPermissions" -> {
                    if (hasCallPermissions()) {
                        requestBatteryOptimizationExemption()
                        result.success(true)
                    } else {
                        pendingPermissionResult = result
                        val permissions = mutableListOf(
                            Manifest.permission.READ_PHONE_STATE,
                            Manifest.permission.READ_CALL_LOG,
                            Manifest.permission.CALL_PHONE,
                            Manifest.permission.RECORD_AUDIO
                        )
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        ActivityCompat.requestPermissions(
                            this,
                            permissions.toTypedArray(),
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

                "stopTracking" -> {
                    val intent = getTrackingServiceIntent()
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                    result.success(true)
                }

                "logoutStopService" -> {
                    stopService(Intent(this, CallTrackingService::class.java))
                    result.success(true)
                }

                "hasCallPermissions" -> {
                    result.success(hasCallPermissions())
                }

                "isTrackingActive" -> {
                    val flutterPrefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                    val active = flutterPrefs.getBoolean("flutter.tracking_toggled_active", false)
                    result.success(active)
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CODE_SET_DEFAULT_DIALER) {
            val isHeld = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = getSystemService(Context.ROLE_SERVICE) as android.app.role.RoleManager
                roleManager.isRoleHeld(android.app.role.RoleManager.ROLE_DIALER)
            } else {
                val telecomManager = getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
                telecomManager.defaultDialerPackage == packageName
            }
            pendingRoleResult?.success(isHeld)
            pendingRoleResult = null
        }
    }




    private fun getTrackingServiceIntent(): Intent {
        val flutterPrefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val token = flutterPrefs.getString("flutter.access_token", "") ?: ""
        val empId = flutterPrefs.getString("flutter.user_emp_id", "") ?: ""
        val orgId = flutterPrefs.getString("flutter.user_org_id", "") ?: ""
        val systemId = flutterPrefs.getString("flutter.user_system_id", "") ?: ""
        val baseUrl = flutterPrefs.getString("flutter.api_base_url", "") ?: ""
        val active = flutterPrefs.getBoolean("flutter.tracking_toggled_active", false)

        return Intent(this, CallTrackingService::class.java).apply {
            putExtra("access_token", token)
            putExtra("user_emp_id", empId)
            putExtra("user_org_id", orgId)
            putExtra("user_system_id", systemId)
            putExtra("api_base_url", baseUrl)
            putExtra("tracking_toggled_active", active)
        }
    }

    private fun startCallTrackingService() {
        val intent = getTrackingServiceIntent()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun hasCallPermissions(): Boolean {
        val basePermissions = hasPermission(Manifest.permission.READ_PHONE_STATE) &&
                hasPermission(Manifest.permission.READ_CALL_LOG)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            basePermissions && hasPermission(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            basePermissions
        }
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
        if (allGranted) {
            requestBatteryOptimizationExemption()
        }
        pendingPermissionResult?.success(allGranted)
        pendingPermissionResult = null
    }

    private fun requestBatteryOptimizationExemption() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                    val intent = Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = android.net.Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to request battery optimization exemption", e)
        }
    }

    override fun onDestroy() {
        methodChannel = null
        super.onDestroy()
    }
}
