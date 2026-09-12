package com.shoption.calltracker.telecom

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.telecom.Call
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class CallState {
    IDLE,
    DIALING,
    RINGING,
    CONNECTED,
    DISCONNECTED
}

data class CurrentCallInfo(
    val state: CallState,
    val phoneNumber: String = "",
    val durationSeconds: Long = 0,
    val disconnectCause: String = "",
    val isMuted: Boolean = false,
    val isSpeakerOn: Boolean = false,
    val isHeld: Boolean = false,
    val isRecording: Boolean = false,
    val recordingPath: String = ""
)

class CallManager private constructor() {

    private val _callState = MutableStateFlow(CurrentCallInfo(CallState.IDLE))
    val callState: StateFlow<CurrentCallInfo> = _callState.asStateFlow()

    private var inCallService: InCallServiceImpl? = null
    private var activeCall: Call? = null
    private var callStartTime: Long = 0
    private var isCallLockAcquired: Boolean = false

    fun setInCallService(service: InCallServiceImpl) {
        this.inCallService = service
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            val number = call.details?.handle?.schemeSpecificPart ?: ""
            Log.d("CallManager", "Telecom Call state changed to: $state for $number")

            when (state) {
                Call.STATE_CONNECTING, Call.STATE_DIALING -> {
                    _callState.value = CurrentCallInfo(CallState.DIALING, number)
                }
                Call.STATE_RINGING -> {
                    _callState.value = CurrentCallInfo(CallState.RINGING, number)
                }
                Call.STATE_ACTIVE -> {
                    if (callStartTime == 0L) {
                        callStartTime = System.currentTimeMillis()
                    }
                    _callState.value = CurrentCallInfo(CallState.CONNECTED, number)
                }
                Call.STATE_DISCONNECTED -> {
                    val duration = if (callStartTime > 0) (System.currentTimeMillis() - callStartTime) / 1000 else 0
                    val cause = call.details?.disconnectCause?.reason ?: "DISCONNECTED"
                    Log.d("CallManager", "Call disconnected. Duration: ${duration}s, Cause: $cause")

                    val context = inCallService?.applicationContext
                    if (context != null) {
                        val db = com.shoption.calltracker.data.DialerDatabase.getDatabase(context)
                        val dao = db.leadDao()
                        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                            val leads = dao.getLeadsForCampaign("pune_leads")
                            val manualLead = leads.firstOrNull { it.phoneNumber == number && it.status == "DIALING" }
                            if (manualLead != null) {
                                dao.updateLead(
                                    manualLead.copy(
                                        status = "COMPLETED",
                                        durationSeconds = duration
                                    )
                                )
                            }
                        }
                    }

                    _callState.value = CurrentCallInfo(
                        state = CallState.DISCONNECTED,
                        phoneNumber = number,
                        durationSeconds = duration,
                        disconnectCause = cause
                    )
                    cleanupCall()
                }
            }
        }
    }

    fun onCallAdded(call: Call) {
        Log.d("CallManager", "onCallAdded registered: ${call.details?.handle}")
        activeCall?.unregisterCallback(callCallback)
        activeCall = call
        callStartTime = 0
        call.registerCallback(callCallback)
        callCallback.onStateChanged(call, call.state)
    }

    fun onCallRemoved(call: Call) {
        if (activeCall == call) {
            Log.d("CallManager", "onCallRemoved")
            cleanupCall()
        }
    }

    private fun cleanupCall() {
        activeCall?.unregisterCallback(callCallback)
        activeCall = null
        callStartTime = 0
        isCallLockAcquired = false
    }

    fun updateTelephonyState(newState: CallState) {
        val current = _callState.value
        Log.d("CallManager", "Telephony state update: ${current.state} -> $newState")
        if (newState == CallState.DISCONNECTED) {
            cleanupCall()
        }
        _callState.value = current.copy(state = newState)
    }

    fun resetStateToIdle() {
        cleanupCall()
        _callState.value = CurrentCallInfo(CallState.IDLE)
    }

    @Synchronized
    fun placeSimCall(context: Context, phoneNumber: String, phoneAccountHandle: PhoneAccountHandle?): Boolean {
        if (_callState.value.state == CallState.DIALING || _callState.value.state == CallState.CONNECTED) {
            Log.w("CallManager", "Call placement rejected: Active call already in progress! State: ${_callState.value.state}")
            return false
        }

        return try {
            isCallLockAcquired = true
            val uri = Uri.fromParts("tel", phoneNumber, null)
            val intent = android.content.Intent(android.content.Intent.ACTION_CALL, uri).apply {
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                if (phoneAccountHandle != null) {
                    putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, phoneAccountHandle)
                }
            }

            Log.d("CallManager", "Placing call via System Phone Dialer to $phoneNumber")
            _callState.value = CurrentCallInfo(CallState.DIALING, phoneNumber)
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            Log.e("CallManager", "Failed to place call via System Phone Dialer", e)
            isCallLockAcquired = false
            _callState.value = CurrentCallInfo(CallState.DISCONNECTED, phoneNumber, 0, "PLACEMENT_FAILED")
            false
        }
    }

    fun onCallAudioStateChanged(audioState: android.telecom.CallAudioState) {
        val isMuted = audioState.isMuted
        val isSpeakerOn = (audioState.route == android.telecom.CallAudioState.ROUTE_SPEAKER)
        val current = _callState.value
        _callState.value = current.copy(isMuted = isMuted, isSpeakerOn = isSpeakerOn)
    }

    fun setMuted(muted: Boolean) {
        try {
            inCallService?.setMuted(muted)
            val current = _callState.value
            _callState.value = current.copy(isMuted = muted)
            Log.d("CallManager", "Call Muted set to: $muted")
        } catch (e: Exception) {
            Log.e("CallManager", "Error setting mute", e)
        }
    }

    fun setSpeakerphone(speakerOn: Boolean) {
        try {
            val route = if (speakerOn) android.telecom.CallAudioState.ROUTE_SPEAKER else android.telecom.CallAudioState.ROUTE_EARPIECE
            inCallService?.setAudioRoute(route)
            val current = _callState.value
            _callState.value = current.copy(isSpeakerOn = speakerOn)
            Log.d("CallManager", "Call Speakerphone set to: $speakerOn")
        } catch (e: Exception) {
            Log.e("CallManager", "Error setting speakerphone", e)
        }
    }

    fun toggleHold() {
        try {
            val call = activeCall ?: return
            val isCurrentlyHeld = (call.state == Call.STATE_HOLDING)
            if (isCurrentlyHeld) {
                call.unhold()
                val current = _callState.value
                _callState.value = current.copy(isHeld = false)
            } else {
                call.hold()
                val current = _callState.value
                _callState.value = current.copy(isHeld = true)
            }
            Log.d("CallManager", "Toggle hold. Was held: $isCurrentlyHeld")
        } catch (e: Exception) {
            Log.e("CallManager", "Error toggling hold", e)
        }
    }

    fun playDtmf(digit: Char) {
        try {
            activeCall?.playDtmfTone(digit)
            activeCall?.stopDtmfTone()
        } catch (e: Exception) {
            Log.e("CallManager", "Error playing DTMF tone $digit", e)
        }
    }

    fun endCurrentCall() {
        try {
            activeCall?.disconnect()
        } catch (e: Exception) {
            Log.e("CallManager", "Error disconnecting active call", e)
        }
    }

    companion object {
        val instance: CallManager by lazy { CallManager() }
    }
}
