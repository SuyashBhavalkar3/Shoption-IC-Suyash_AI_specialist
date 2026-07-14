package com.shoption.calltracker

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CallLog
import android.text.format.DateFormat
import android.util.Log
import androidx.core.content.ContextCompat
import java.util.Date

/**
 * Syncs call logs from the Android system into the local SQLite database.
 * There is no tracking_enabled gate — if this method is called, it syncs.
 * Only calls that occurred on or after tracking_start_time are imported,
 * ensuring we don't pull in the warrior's entire call history.
 */
object CallLogSync {
    private const val TAG = "CallLogSync"
    private const val PREFS_NAME = "call_tracker_prefs"
    private const val KEY_START_TIME = "tracking_start_time"
    // Max calls to import per sync trigger to avoid blocking the main thread.
    private const val MAX_CALLS_PER_SYNC = 50
    private val syncLock = Any()

    fun syncLatest(context: Context) {
        try {
            val thread = Thread {
                try {
                    synchronized(syncLock) {
                        val hasPermission = ContextCompat.checkSelfPermission(
                            context, Manifest.permission.READ_CALL_LOG
                        ) == PackageManager.PERMISSION_GRANTED
                        if (!hasPermission) {
                            Log.w(TAG, "READ_CALL_LOG permission not granted — skipping sync")
                            return@synchronized
                        }

                        val flutterPrefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                        val userId = flutterPrefs.getString("flutter.user_id", null)
                        if (userId.isNullOrEmpty()) {
                            Log.d(TAG, "No active user_id found in FlutterSharedPreferences — skipping call log sync")
                            return@synchronized
                        }

                        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                        val startTime = prefs.getLong(KEY_START_TIME, 0L)
                        Log.d(TAG, "syncLatest called — tracking_start_time=$startTime for userId=$userId")

                        try {
                            val db = CallDatabase.getInstance(context)
                            val projection = arrayOf(
                                CallLog.Calls._ID,
                                CallLog.Calls.NUMBER,
                                CallLog.Calls.TYPE,
                                CallLog.Calls.DATE,
                                CallLog.Calls.DURATION
                            )

                            val selection = if (startTime > 0L) "${CallLog.Calls.DATE} >= ?" else null
                            val selectionArgs = if (startTime > 0L) arrayOf(startTime.toString()) else null

                            val cursor = context.contentResolver.query(
                                CallLog.Calls.CONTENT_URI,
                                projection,
                                selection,
                                selectionArgs,
                                "${CallLog.Calls.DATE} DESC"
                            ) ?: run {
                                Log.w(TAG, "ContentResolver returned null cursor")
                                return@synchronized
                            }

                            var processed = 0
                            var inserted = 0
                            cursor.use {
                                while (it.moveToNext() && processed < MAX_CALLS_PER_SYNC) {
                                    val systemId = it.getLong(it.getColumnIndexOrThrow(CallLog.Calls._ID)).toString()
                                    val dateMillis = it.getLong(it.getColumnIndexOrThrow(CallLog.Calls.DATE))
                                    val number = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.NUMBER)) ?: "Unknown"
                                    val typeInt = it.getInt(it.getColumnIndexOrThrow(CallLog.Calls.TYPE))
                                    val callType = mapCallType(typeInt) ?: run {
                                        Log.v(TAG, "Unknown call type=$typeInt for id=$systemId — skipping")
                                        continue
                                    }
                                    val duration = it.getLong(it.getColumnIndexOrThrow(CallLog.Calls.DURATION)).toInt()
                                    val timestamp = DateFormat.format("dd-MMM-yyyy HH:mm", Date(dateMillis)).toString()

                                    val rowId = db.insertCallLogFromSystem(
                                        phoneNumber = number,
                                        callType = callType,
                                        durationSeconds = duration,
                                        timestamp = timestamp,
                                        systemCallId = systemId,
                                        userId = userId
                                    )
                                    if (rowId != -1L) {
                                        inserted++
                                        Log.d(TAG, "✅ Inserted: id=$systemId type=$callType number=$number dur=${duration}s ts=$timestamp")
                                        try {
                                            android.os.Handler(android.os.Looper.getMainLooper()).post {
                                                try {
                                                    MainActivity.methodChannel?.invokeMethod("onNewCallLogged", null)
                                                } catch (t: Throwable) {
                                                    Log.w(TAG, "Failed to notify Flutter of new call log: ${t.message}")
                                                }
                                            }
                                        } catch (t: Throwable) {
                                            Log.w(TAG, "Failed to post to main looper: ${t.message}")
                                        }
                                    } else {
                                        Log.v(TAG, "Duplicate (already exists): id=$systemId")
                                    }
                                    processed++
                                }
                            }
                            Log.d(TAG, "syncLatest complete — processed=$processed new_inserted=$inserted")
                        } catch (e: SecurityException) {
                            Log.e(TAG, "SecurityException reading call log", e)
                        } catch (e: Exception) {
                            Log.e(TAG, "Call log sync failed", e)
                        }
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "syncLatest thread crashed (swallowed): ${t.message}", t)
                }
            }
            thread.name = "CallTracker-sync"
            thread.uncaughtExceptionHandler = Thread.UncaughtExceptionHandler { t, e ->
                Log.e(TAG, "UNCAUGHT in ${t.name}: ${e.message}", e)
            }
            thread.start()
        } catch (t: Throwable) {
            Log.e(TAG, "Failed to start sync thread: ${t.message}", t)
        }
    }

    private fun mapCallType(type: Int): String? = when (type) {
        CallLog.Calls.OUTGOING_TYPE  -> "Outgoing"
        CallLog.Calls.INCOMING_TYPE  -> "Incoming"
        CallLog.Calls.MISSED_TYPE    -> "Missed"
        CallLog.Calls.REJECTED_TYPE  -> "Rejected"
        CallLog.Calls.BLOCKED_TYPE   -> "Blocked"
        else -> null
    }
}
