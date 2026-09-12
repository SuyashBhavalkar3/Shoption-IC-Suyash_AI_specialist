package com.shoption.calltracker.telecom

import android.app.role.RoleManager
import android.content.Context
import android.os.Build
import android.telecom.TelecomManager
import com.shoption.calltracker.autodialer.AutoDialerManager
import com.shoption.calltracker.data.DialerDatabase
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AutoDialerPlugin(private val context: Context, private val autoDialerManager: AutoDialerManager) :
    MethodChannel.MethodCallHandler, EventChannel.StreamHandler {

    private val METHOD_CHANNEL = "com.shoption.calltracker/autodialer"
    private val EVENT_CHANNEL = "com.shoption.calltracker/autodialer_events"

    private var eventSink: EventChannel.EventSink? = null
    private val scope = CoroutineScope(Dispatchers.Main)
    private val db = DialerDatabase.getDatabase(context)
    private val simManager = SimManager(context)

    fun registerWith(flutterEngine: FlutterEngine) {
        val methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL)
        methodChannel.setMethodCallHandler(this)

        val eventChannel = EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL)
        eventChannel.setStreamHandler(this)

        scope.launch {
            autoDialerManager.uiState.collect { state ->
                val callInfo = CallManager.instance.callState.value
                val map = mapOf(
                    "status" to state.status.name,
                    "campaignId" to state.campaignId,
                    "currentLeadName" to (state.currentLead?.name ?: ""),
                    "currentLeadPhone" to (state.currentLead?.phoneNumber ?: ""),
                    "currentLeadStatus" to (state.currentLead?.status ?: ""),
                    "nextLeadName" to (state.nextLead?.name ?: ""),
                    "nextLeadPhone" to (state.nextLead?.phoneNumber ?: ""),
                    "callState" to state.callState.name,
                    "totalLeads" to state.totalLeads,
                    "completedLeads" to state.completedLeads,
                    "callDurationSeconds" to state.callDurationSeconds,
                    "delaySeconds" to state.delaySeconds,
                    "selectedSimSlot" to state.selectedSimSlot,
                    "isMuted" to callInfo.isMuted,
                    "isSpeakerOn" to callInfo.isSpeakerOn,
                    "isHeld" to callInfo.isHeld,
                    "isRecording" to callInfo.isRecording,
                    "recordingPath" to callInfo.recordingPath
                )
                eventSink?.success(map)
            }
        }
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "playRecording" -> {
                val path = call.argument<String>("path") ?: ""
                val file = java.io.File(path)
                if (path.isNotEmpty() && file.exists() && file.length() > 0) {
                    try {
                        val mediaPlayer = android.media.MediaPlayer().apply {
                            setAudioAttributes(
                                android.media.AudioAttributes.Builder()
                                    .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build()
                            )
                            setDataSource(path)
                            setVolume(1.0f, 1.0f)
                            prepare()
                            start()
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        android.util.Log.e("AutoDialerPlugin", "Error playing recording file: $path", e)
                        result.success(false)
                    }
                } else {
                    android.util.Log.w("AutoDialerPlugin", "Recording path empty or file missing/0-bytes: $path")
                    result.success(false)
                }
            }
            "isDefaultDialer" -> {
                result.success(isDefaultDialer())
            }
            "dialCustomNumber" -> {
                val number = call.argument<String>("phoneNumber") ?: ""
                val simSlot = call.argument<Int>("selectedSimSlot") ?: 0
                if (number.isNotEmpty()) {
                    val manualId = "MANUAL_${System.currentTimeMillis()}"
                    val manualLead = com.shoption.calltracker.data.LeadEntity(
                        id = manualId,
                        name = "Manual Dial ($number)",
                        phoneNumber = number,
                        campaignId = "pune_leads",
                        priority = 0,
                        status = "DIALING",
                        attempts = 1,
                        lastAttemptAt = System.currentTimeMillis(),
                        simUsed = "SIM ${simSlot + 1}"
                    )
                    scope.launch(Dispatchers.IO) {
                        db.leadDao().insertLeads(listOf(manualLead))
                    }
                    val handle = simManager.getSelectedPhoneAccountHandle(simSlot)
                    val success = CallManager.instance.placeSimCall(context, number, handle)
                    result.success(success)
                } else {
                    result.success(false)
                }
            }
            "setMute" -> {
                val muted = call.argument<Boolean>("muted") ?: false
                CallManager.instance.setMuted(muted)
                result.success(true)
            }
            "setSpeakerphone" -> {
                val speakerOn = call.argument<Boolean>("speakerOn") ?: false
                CallManager.instance.setSpeakerphone(speakerOn)
                result.success(true)
            }
            "toggleHold" -> {
                CallManager.instance.toggleHold()
                result.success(true)
            }
            "playDtmf" -> {
                val digitStr = call.argument<String>("digit") ?: ""
                if (digitStr.isNotEmpty()) {
                    CallManager.instance.playDtmf(digitStr[0])
                }
                result.success(true)
            }
            "getSimCards" -> {
                val sims = simManager.getAvailableSimCards()
                val list = sims.map {
                    mapOf(
                        "slotIndex" to it.slotIndex,
                        "subscriptionId" to it.subscriptionId,
                        "displayName" to it.displayName,
                        "carrierName" to it.carrierName,
                        "number" to it.number
                    )
                }
                result.success(list)
            }
            "loadDemoLeads" -> {
                val campaignId = call.argument<String>("campaignId") ?: "pune_leads"
                scope.launch(Dispatchers.IO) {
                    autoDialerManager.loadDemoLeadsIfEmpty(campaignId)
                    result.success(true)
                }
            }
            "resetCampaign" -> {
                val campaignId = call.argument<String>("campaignId") ?: "pune_leads"
                scope.launch(Dispatchers.IO) {
                    autoDialerManager.resetCampaignLeads(campaignId)
                    result.success(true)
                }
            }
            "startAutoDialer" -> {
                val campaignId = call.argument<String>("campaignId") ?: "pune_leads"
                val simSlot = call.argument<Int>("selectedSimSlot") ?: 0
                val delay = call.argument<Int>("delaySeconds") ?: 2
                autoDialerManager.startAutoDialer(campaignId, simSlot, delay)
                result.success(true)
            }
            "pauseAutoDialer" -> {
                autoDialerManager.pauseAutoDialer()
                result.success(true)
            }
            "resumeAutoDialer" -> {
                autoDialerManager.resumeAutoDialer()
                result.success(true)
            }
            "skipCurrentLead" -> {
                autoDialerManager.skipCurrentLead()
                result.success(true)
            }
            "endCurrentCall" -> {
                autoDialerManager.endCurrentCall()
                result.success(true)
            }
            "stopCampaign" -> {
                autoDialerManager.stopCampaign()
                result.success(true)
            }
            "getCallHistory" -> {
                val campaignId = call.argument<String>("campaignId") ?: "pune_leads"
                scope.launch(Dispatchers.IO) {
                    val leads = db.leadDao().getLeadsForCampaign(campaignId)
                    val list = leads.map {
                        mapOf(
                            "id" to it.id,
                            "name" to it.name,
                            "phoneNumber" to it.phoneNumber,
                            "status" to it.status,
                            "durationSeconds" to it.durationSeconds,
                            "lastAttemptAt" to (it.lastAttemptAt ?: 0L),
                            "simUsed" to (it.simUsed ?: "SIM 1"),
                            "recordingPath" to (it.failureReason ?: "")
                        )
                    }
                    result.success(list)
                }
            }
            "getCampaignStats" -> {
                val campaignId = call.argument<String>("campaignId") ?: "pune_leads"
                scope.launch(Dispatchers.IO) {
                    val dao = db.leadDao()
                    val total = dao.getTotalCount(campaignId)
                    val completed = dao.getCompletedCount(campaignId)
                    val noAnswer = dao.getNoAnswerCount(campaignId)
                    val busy = dao.getBusyCount(campaignId)
                    val failed = dao.getFailedCount(campaignId)
                    val skipped = dao.getSkippedCount(campaignId)
                    val remaining = total - (completed + noAnswer + busy + failed + skipped)

                    val map = mapOf(
                        "total" to total,
                        "completed" to completed,
                        "noAnswer" to noAnswer,
                        "busy" to busy,
                        "failed" to failed,
                        "skipped" to skipped,
                        "remaining" to if (remaining < 0) 0 else remaining
                    )
                    result.success(map)
                }
            }
            else -> result.notImplemented()
        }
    }

    private fun isDefaultDialer(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(Context.ROLE_SERVICE) as RoleManager
            roleManager.isRoleHeld(RoleManager.ROLE_DIALER)
        } else {
            val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            telecomManager.getDefaultDialerPackage() == context.packageName
        }
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }
}
