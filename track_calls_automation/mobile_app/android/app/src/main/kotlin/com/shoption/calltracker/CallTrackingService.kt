package com.shoption.calltracker

import android.app.Service
import android.content.pm.ServiceInfo
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.app.NotificationManager
import android.app.NotificationChannel
import android.app.PendingIntent
import android.content.Context
import android.database.ContentObserver
import android.provider.CallLog
import android.os.PowerManager
import android.app.AlarmManager
import android.util.Log
import androidx.core.app.NotificationCompat
import android.telephony.TelephonyManager
import android.telephony.PhoneStateListener

/**
 * Foreground service for enterprise call tracking.
 * Started and stopped explicitly by the user.
 *
 * ARCHITECTURE NOTE: Uses Handler.postDelayed on the main looper for the
 * heartbeat loop instead of java.util.Timer. A Timer thread can die silently
 * if any uncaught Throwable escapes; a Handler on the main looper survives
 * as long as the process is alive.
 */
class CallTrackingService : Service() {
    private val tag = "CallTrackingService"

    companion object {
        var isRunning = false
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "call_tracking_channel"
        private const val PREFS_NAME = "call_tracker_prefs"
        private const val KEY_START_TIME = "tracking_start_time"
        private const val HEARTBEAT_INTERVAL_MS = 10000L

        var accessToken: String? = null
        var empId: String = ""
        var orgId: String = ""
        var systemId: String = ""
        var baseUrl: String = ""
        var isTrackingEnabled: Boolean = false
        var isCurrentlyOnCall: Boolean = false
    }

    private var phoneStateListener: PhoneStateListener? = null
    private var callLogObserver: ContentObserver? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private var heartbeatThread: Thread? = null
    private var heartbeatRunning = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // Set the epoch for call-log filtering on the very first run.
        // This is never reset so we don't lose calls across restarts.
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (prefs.getLong(KEY_START_TIME, 0L) == 0L) {
            prefs.edit().putLong(KEY_START_TIME, System.currentTimeMillis()).apply()
            Log.d(tag, "tracking_start_time initialised to ${System.currentTimeMillis()}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            intent.getStringExtra("access_token")?.let { if (it.isNotEmpty()) accessToken = it }
            intent.getStringExtra("user_emp_id")?.let { if (it.isNotEmpty()) empId = it }
            intent.getStringExtra("user_org_id")?.let { if (it.isNotEmpty()) orgId = it }
            intent.getStringExtra("user_system_id")?.let { if (it.isNotEmpty()) systemId = it }
            intent.getStringExtra("api_base_url")?.let { if (it.isNotEmpty()) baseUrl = it }
            if (intent.hasExtra("tracking_toggled_active")) {
                isTrackingEnabled = intent.getBooleanExtra("tracking_toggled_active", false)
            }
        }

        if (accessToken.isNullOrEmpty() || systemId.isEmpty()) {
            val flutterPrefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            accessToken = flutterPrefs.getString("flutter.access_token", null)
            empId = flutterPrefs.getString("flutter.user_emp_id", "") ?: ""
            orgId = flutterPrefs.getString("flutter.user_org_id", "") ?: ""
            systemId = flutterPrefs.getString("flutter.user_system_id", "") ?: ""
            baseUrl = flutterPrefs.getString("flutter.api_base_url", "") ?: ""
            isTrackingEnabled = flutterPrefs.getBoolean("flutter.tracking_toggled_active", false)
        }

        try {
            startForegroundTracking()
            ensureListenersRegistered(isTrackingEnabled)
            Log.d(tag, "Service state updated: isTrackingEnabled=$isTrackingEnabled, systemId=$systemId")
        } catch (t: Throwable) {
            Log.e(tag, "Service start failed", t)
            // Don't stopSelf — let START_STICKY retry
        }
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(tag, "onTaskRemoved called - app swiped away from recents. Scheduling restart.")
        try {
            val restartServiceIntent = Intent(applicationContext, this.javaClass).apply {
                setPackage(packageName)
            }
            val restartServicePendingIntent = PendingIntent.getService(
                applicationContext,
                1,
                restartServiceIntent,
                PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmService = applicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmService.set(
                AlarmManager.RTC,
                System.currentTimeMillis() + 1000,
                restartServicePendingIntent
            )
        } catch (e: Exception) {
            Log.e(tag, "Failed to schedule service restart on task removed", e)
        }
        super.onTaskRemoved(rootIntent)
    }

    private fun sendCallStateUpdate(context: Context, isOnCall: Boolean) {
        val token = accessToken
        val url = baseUrl

        if (token.isNullOrEmpty() || url.isEmpty()) {
            Log.d(tag, "Skipping call state update: token or baseUrl is missing")
            return
        }

        safeThread("call-state-update") {
            val endpoint = java.net.URL("$url/users/track/call-state")
            val conn = endpoint.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; utf-8")
            conn.setRequestProperty("Accept", "application/json")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.doOutput = true
            conn.connectTimeout = 10000
            conn.readTimeout = 10000

            val jsonInputString = "{\"is_on_call\": $isOnCall}"

            conn.outputStream.use { os ->
                val input = jsonInputString.toByteArray(charset("utf-8"))
                os.write(input, 0, input.size)
            }

            val responseCode = conn.responseCode
            Log.d(tag, "Call State Update Response Code: $responseCode")
            conn.disconnect()
        }
    }

    private fun ensureListenersRegistered(enabled: Boolean) {
        if (enabled) {
            if (phoneStateListener == null) {
                phoneStateListener = object : PhoneStateListener() {
                    @Deprecated("Deprecated in Java")
                    override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                        try {
                            super.onCallStateChanged(state, phoneNumber)
                            Log.d(tag, "PhoneStateListener onCallStateChanged state=$state")
                            when (state) {
                                TelephonyManager.CALL_STATE_RINGING,
                                TelephonyManager.CALL_STATE_OFFHOOK -> {
                                    isCurrentlyOnCall = true
                                    sendCallStateUpdate(this@CallTrackingService, true)
                                }
                                TelephonyManager.CALL_STATE_IDLE -> {
                                    isCurrentlyOnCall = false
                                    sendCallStateUpdate(this@CallTrackingService, false)
                                    CallLogSync.syncLatest(this@CallTrackingService)
                                }
                            }
                        } catch (t: Throwable) {
                            Log.e(tag, "PhoneStateListener callback crashed (swallowed)", t)
                        }
                    }
                }
                val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
                Log.d(tag, "PhoneStateListener registered dynamically")
            }
            registerCallLogObserver()
        } else {
            if (phoneStateListener != null) {
                try {
                    val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                    telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
                } catch (e: Exception) {
                    Log.w(tag, "Failed to unregister PhoneStateListener: ${e.message}")
                }
                phoneStateListener = null
                Log.d(tag, "PhoneStateListener unregistered dynamically")
            }
            unregisterCallLogObserver()
        }
    }

    private fun startForegroundTracking() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isRunning = true
        Log.d(tag, "Call tracking service running")

        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (wakeLock == null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LeadLens::CallTrackingWakeLock")
                wakeLock?.acquire(24 * 60 * 60 * 1000L) // maximum 24 hours lock duration safety limit
                Log.d(tag, "Partial CPU WakeLock acquired")
            }
        } catch (e: Exception) {
            Log.w(tag, "Could not acquire WakeLock", e)
        }

        ensureListenersRegistered(isTrackingEnabled)

        if (isTrackingEnabled) {
            CallLogSync.syncLatest(this)
            Log.d(tag, "Initial sync triggered on service start")
        }
        startHeartbeatLoop()
    }

    private fun buildNotification(): android.app.Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call Tracking Enabled")
            .setContentText("Monitoring business call activity. Tap to manage.")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun registerCallLogObserver() {
        if (callLogObserver != null) return
        callLogObserver = object : ContentObserver(Handler(mainLooper)) {
            override fun onChange(selfChange: Boolean) {
                try {
                    super.onChange(selfChange)
                    Log.d(tag, "CallLog ContentObserver triggered")
                    CallLogSync.syncLatest(this@CallTrackingService)
                } catch (t: Throwable) {
                    Log.e(tag, "ContentObserver.onChange crashed (swallowed)", t)
                }
            }
        }
        contentResolver.registerContentObserver(
            CallLog.Calls.CONTENT_URI, true, callLogObserver!!
        )
        Log.d(tag, "CallLog ContentObserver registered")
    }

    private fun unregisterCallLogObserver() {
        callLogObserver?.let { contentResolver.unregisterContentObserver(it) }
        callLogObserver = null
    }

    override fun onBind(intent: Intent?) = null

    override fun onDestroy() {
        isRunning = false
        stopHeartbeatLoop()
        try {
            if (phoneStateListener != null) {
                val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
                phoneStateListener = null
                Log.d(tag, "PhoneStateListener unregistered in onDestroy")
            }
        } catch (e: Exception) {
            Log.w(tag, "Error unregistering PhoneStateListener in onDestroy", e)
        }
        unregisterCallLogObserver()
        
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
                wakeLock = null
                Log.d(tag, "WakeLock released")
            }
        } catch (e: Exception) {
            Log.w(tag, "Error releasing WakeLock", e)
        }

        Log.d(tag, "CallTrackingService destroyed")
        super.onDestroy()
    }

    private fun startHeartbeatLoop() {
        if (heartbeatThread != null) return
        heartbeatRunning = true
        heartbeatThread = Thread {
            while (isRunning && heartbeatRunning) {
                try {
                    sendHeartbeatPing()
                } catch (t: Throwable) {
                    Log.e(tag, "Error in heartbeat loop thread", t)
                }
                try {
                    Thread.sleep(HEARTBEAT_INTERVAL_MS)
                } catch (e: InterruptedException) {
                    break
                }
            }
        }.apply {
            name = "CallTracker-HeartbeatThread"
            uncaughtExceptionHandler = Thread.UncaughtExceptionHandler { t, e ->
                Log.e(tag, "UNCAUGHT in heartbeat thread ${t.name}: ${e.message}", e)
            }
            start()
        }
        Log.d(tag, "Native heartbeat loop started (Thread-based)")
    }

    private fun stopHeartbeatLoop() {
        heartbeatRunning = false
        heartbeatThread?.interrupt()
        heartbeatThread = null
        Log.d(tag, "Native heartbeat loop stopped")
    }

    private fun sendHeartbeatPing() {
        try {
            ensureListenersRegistered(isTrackingEnabled)
        } catch (t: Throwable) {
            Log.w(tag, "ensureListenersRegistered failed: ${t.message}")
        }

        if (isTrackingEnabled) {
            try {
                CallLogSync.syncLatest(this)
            } catch (t: Throwable) {
                Log.w(tag, "CallLogSync.syncLatest failed: ${t.message}")
            }
        }

        val token = accessToken
        if (token.isNullOrEmpty() || systemId.isEmpty() || baseUrl.isEmpty()) {
            Log.d(tag, "Skipping native heartbeat ping: token=$token systemId=$systemId baseUrl=$baseUrl")
            return
        }

        safeThread("heartbeat-ping") {
            val url = java.net.URL("$baseUrl/users/track/status")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; utf-8")
            conn.setRequestProperty("Accept", "application/json")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.doOutput = true
            conn.connectTimeout = 10000
            conn.readTimeout = 10000

            val isOnCall = isCurrentlyOnCall

            val jsonInputString = """
                {
                    "emp_id": "$empId",
                    "organisation_id": "$orgId",
                    "system_id": "$systemId",
                    "is_tracking_enabled": $isTrackingEnabled,
                    "is_on_call": $isOnCall,
                    "last_activity_timestamp": "${System.currentTimeMillis()}"
                }
            """.trimIndent()

            conn.outputStream.use { os ->
                val input = jsonInputString.toByteArray(charset("utf-8"))
                os.write(input, 0, input.size)
            }

            val responseCode = conn.responseCode
            Log.d(tag, "Native Heartbeat Ping Response Code: $responseCode")
            conn.disconnect()
        }
    }

    /**
     * Spawns a background thread with a built-in UncaughtExceptionHandler
     * so that if anything goes wrong, the process is NOT killed.
     * Standard Thread { }.start() will kill the process on uncaught exceptions.
     */
    private fun safeThread(name: String, block: () -> Unit) {
        val thread = Thread {
            try {
                block()
            } catch (t: Throwable) {
                Log.e(tag, "safeThread[$name] caught: ${t.message}", t)
            }
        }
        thread.name = "CallTracker-$name"
        thread.uncaughtExceptionHandler = Thread.UncaughtExceptionHandler { t, e ->
            Log.e(tag, "UNCAUGHT in thread ${t.name}: ${e.message}", e)
        }
        thread.start()
    }
}
