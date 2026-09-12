package com.shoption.calltracker.telecom

import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.util.Log

class InCallServiceImpl : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.d("InCallServiceImpl", "InCallService: onCallAdded")
        CallManager.instance.setInCallService(this)
        CallManager.instance.onCallAdded(call)
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d("InCallServiceImpl", "InCallService: onCallRemoved")
        CallManager.instance.onCallRemoved(call)
    }

    override fun onCallAudioStateChanged(audioState: CallAudioState?) {
        super.onCallAudioStateChanged(audioState)
        if (audioState != null) {
            CallManager.instance.onCallAudioStateChanged(audioState)
        }
    }
}

