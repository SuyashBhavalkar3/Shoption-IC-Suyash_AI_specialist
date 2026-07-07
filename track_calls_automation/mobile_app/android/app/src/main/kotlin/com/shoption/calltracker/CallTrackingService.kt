package com.shoption.calltracker

import android.app.Service
import android.content.pm.ServiceInfo
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.app.NotificationManager
import android.app.NotificationChannel
import android.app.PendingIntent
import android.content.Context
import android.database.ContentObserver
import android.provider.CallLog
import android.app.AlarmManager
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Foreground service for enterprise call tracking.
 * Started and stopped explicitly by the user.
 */
class CallTrackingService : Service() {
    private val tag = "CallTrackingService"

    companion object {
        var isRunning = false
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "call_tracking_channel"
        private const val PREFS_NAME = "call_tracker_prefs"
        private const val KEY_START_TIME = "tracking_start_time"
    }

    private var callReceiver: CallReceiver? = null
    private var receiverRegistered = false
    private var callLogObserver: ContentObserver? = null
    private var heartbeatTimer: java.util.Timer? = null

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
        try {
            startForegroundTracking()
        } catch (e: Exception) {
            Log.e(tag, "Service start failed", e)
            stopSelf()
            return START_STICKY
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

    private fun startForegroundTracking() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isRunning = true
        Log.d(tag, "Call tracking service running")

        if (!receiverRegistered) {
            callReceiver = CallReceiver()
            val filter = IntentFilter().apply {
                addAction(android.telephony.TelephonyManager.ACTION_PHONE_STATE_CHANGED)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(callReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                registerReceiver(callReceiver, filter)
            }
            receiverRegistered = true
            Log.d(tag, "CallReceiver registered")
        }

        registerCallLogObserver()
        // Do an immediate sync so any calls since last run are captured.
        CallLogSync.syncLatest(this)
        Log.d(tag, "Initial sync triggered on service start")
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
                super.onChange(selfChange)
                Log.d(tag, "CallLog ContentObserver triggered")
                CallLogSync.syncLatest(this@CallTrackingService)
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
            if (receiverRegistered) {
                unregisterReceiver(callReceiver)
                receiverRegistered = false
            }
        } catch (e: Exception) {
            Log.w(tag, "Error unregistering receiver", e)
        }
        unregisterCallLogObserver()
        Log.d(tag, "CallTrackingService destroyed")
        super.onDestroy()
    }

    private fun startHeartbeatLoop() {
        if (heartbeatTimer != null) return
        heartbeatTimer = java.util.Timer()
        heartbeatTimer?.scheduleAtFixedRate(object : java.util.TimerTask() {
            override fun run() {
                if (isRunning) {
                    sendHeartbeatPing()
                }
            }
        }, 0L, 10000L) // every 10 seconds
        Log.d(tag, "Native heartbeat loop started")
    }

    private fun stopHeartbeatLoop() {
        heartbeatTimer?.cancel()
        heartbeatTimer = null
        Log.d(tag, "Native heartbeat loop stopped")
    }

    private fun sendHeartbeatPing() {
        val flutterPrefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val token = flutterPrefs.getString("flutter.access_token", null)
        val empId = flutterPrefs.getString("flutter.user_emp_id", "") ?: ""
        val orgId = flutterPrefs.getString("flutter.user_org_id", "") ?: ""
        val systemId = flutterPrefs.getString("flutter.user_system_id", "") ?: ""
        val baseUrl = flutterPrefs.getString("flutter.api_base_url", "https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net")
            ?: "https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net"

        if (token.isNullOrEmpty() || systemId.isNullOrEmpty()) {
            Log.d(tag, "Skipping native heartbeat ping: token or systemId is missing")
            return
        }

        Thread {
            try {
                val url = java.net.URL("$baseUrl/users/track/status")
                val conn = url.openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Accept", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                val jsonInputString = """
                    {
                        "emp_id": "$empId",
                        "organisation_id": "$orgId",
                        "system_id": "$systemId",
                        "is_tracking_enabled": true,
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
            } catch (e: Exception) {
                Log.e(tag, "Error sending native heartbeat ping", e)
            }
        }.start()
    }
}
