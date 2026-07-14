package com.shoption.calltracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

/**
 * Listens for phone state changes and triggers a call log sync whenever
 * a call session ends. Also sends real-time call state updates to the server.
 */
class CallReceiver : BroadcastReceiver() {
    private val tag = "CallReceiver"

    companion object {
        private var wasInCallSession = false
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        when (intent.action) {
            TelephonyManager.ACTION_PHONE_STATE_CHANGED -> {
                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                Log.d(tag, "PHONE_STATE_CHANGED state=$state")

                when (state) {
                    TelephonyManager.EXTRA_STATE_RINGING,
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                        wasInCallSession = true
                        sendCallStateUpdate(context, true)
                    }
                    TelephonyManager.EXTRA_STATE_IDLE -> {
                        if (wasInCallSession) {
                            Log.d(tag, "Call session ended — syncing call logs")
                            CallLogSync.syncLatest(context)
                        }
                        wasInCallSession = false
                        sendCallStateUpdate(context, false)
                    }
                }
            }
        }
    }

    private fun sendCallStateUpdate(context: Context, isOnCall: Boolean) {
        val flutterPrefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val token = flutterPrefs.getString("flutter.access_token", null)
        val baseUrl = flutterPrefs.getString("flutter.api_base_url", "") ?: ""

        if (token.isNullOrEmpty()) {
            Log.d(tag, "Skipping call state update: token is missing")
            return
        }

        val pendingResult = goAsync()
        Thread {
            try {
                val url = java.net.URL("$baseUrl/users/track/call-state")
                val conn = url.openConnection() as java.net.HttpURLConnection
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
            } catch (e: Exception) {
                Log.e(tag, "Error sending call state update", e)
            } finally {
                pendingResult.finish()
            }
        }.start()
    }
}
