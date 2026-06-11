package com.shoption.calltracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

/**
 * Listens for phone state changes and triggers a call log sync whenever
 * a call session ends. No tracking_enabled gate — always active when registered.
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
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> wasInCallSession = true
                    TelephonyManager.EXTRA_STATE_IDLE -> {
                        if (wasInCallSession) {
                            Log.d(tag, "Call session ended — syncing call logs")
                            CallLogSync.syncLatest(context)
                        }
                        wasInCallSession = false
                    }
                }
            }
        }
    }
}
