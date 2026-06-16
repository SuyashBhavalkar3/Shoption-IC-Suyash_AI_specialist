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
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Always-on foreground service that tracks calls.
 * There is NO enable/disable toggle — tracking is always active once the
 * service is started. The leader/warrior UI toggle has been removed.
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
            return START_NOT_STICKY
        }
        return START_NOT_STICKY
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
}
