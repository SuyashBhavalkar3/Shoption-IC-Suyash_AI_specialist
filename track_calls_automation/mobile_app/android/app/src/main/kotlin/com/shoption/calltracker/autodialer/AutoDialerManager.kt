package com.shoption.calltracker.autodialer

import android.content.Context
import android.telecom.PhoneAccountHandle
import android.util.Log
import com.shoption.calltracker.data.DialerDatabase
import com.shoption.calltracker.data.LeadEntity
import com.shoption.calltracker.telecom.CallManager
import com.shoption.calltracker.telecom.CallState
import com.shoption.calltracker.telecom.SimManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class DialerStatus {
    IDLE,
    RUNNING,
    PAUSED,
    COOLDOWN,
    STOPPED
}

data class AutoDialerState(
    val status: DialerStatus = DialerStatus.IDLE,
    val campaignId: String = "pune_leads",
    val currentLead: LeadEntity? = null,
    val nextLead: LeadEntity? = null,
    val callState: CallState = CallState.IDLE,
    val totalLeads: Int = 0,
    val completedLeads: Int = 0,
    val callDurationSeconds: Long = 0,
    val delaySeconds: Int = 2,
    val selectedSimSlot: Int = 0,
    val isDefaultDialer: Boolean = false
)

class AutoDialerManager(private val context: Context) {

    private val db = DialerDatabase.getDatabase(context)
    private val leadDao = db.leadDao()
    private val callManager = CallManager.instance
    private val simManager = SimManager(context)

    private val coroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _uiState = MutableStateFlow(AutoDialerState())
    val uiState: StateFlow<AutoDialerState> = _uiState.asStateFlow()

    private var activeJob: Job? = null

    init {
        observeCallState()
    }

    private fun observeCallState() {
        coroutineScope.launch {
            callManager.callState.collect { info ->
                val currentState = _uiState.value
                Log.d("AutoDialerManager", "Observed CallState transition: ${info.state}, dialer status: ${currentState.status}")
                _uiState.value = currentState.copy(
                    callState = info.state,
                    callDurationSeconds = info.durationSeconds
                )

                if (info.state == CallState.DISCONNECTED) {
                    if (currentState.status == DialerStatus.RUNNING || currentState.status == DialerStatus.COOLDOWN) {
                        onCallDisconnected(info.durationSeconds, info.disconnectCause)
                    }
                    callManager.resetStateToIdle()
                }
            }
        }
    }

    suspend fun refreshCampaignState(campaignId: String = "pune_leads") {
        withContext(Dispatchers.IO) {
            val total = leadDao.getTotalCount(campaignId)
            val completed = leadDao.getCompletedCount(campaignId)
            val next = leadDao.getNextReadyLead(campaignId)

            _uiState.value = _uiState.value.copy(
                campaignId = campaignId,
                totalLeads = total,
                completedLeads = completed,
                nextLead = next
            )
        }
    }

    fun startAutoDialer(campaignId: String = "pune_leads", selectedSimSlot: Int = 0, delaySeconds: Int = 2) {
        if (_uiState.value.status == DialerStatus.RUNNING) return

        _uiState.value = _uiState.value.copy(
            status = DialerStatus.RUNNING,
            campaignId = campaignId,
            selectedSimSlot = selectedSimSlot,
            delaySeconds = delaySeconds
        )

        activeJob?.cancel()
        activeJob = coroutineScope.launch {
            val nextReady = leadDao.getNextReadyLead(campaignId)
            if (nextReady == null) {
                resetCampaignLeads(campaignId)
            }
            dialNextLead()
        }
    }

    fun pauseAutoDialer() {
        _uiState.value = _uiState.value.copy(status = DialerStatus.PAUSED)
        Log.d("AutoDialerManager", "Auto dialer paused by user.")
    }

    fun resumeAutoDialer() {
        if (_uiState.value.status != DialerStatus.PAUSED) return
        _uiState.value = _uiState.value.copy(status = DialerStatus.RUNNING)
        Log.d("AutoDialerManager", "Auto dialer resumed by user.")

        activeJob?.cancel()
        activeJob = coroutineScope.launch {
            dialNextLead()
        }
    }

    fun skipCurrentLead() {
        coroutineScope.launch {
            val lead = _uiState.value.currentLead
            if (lead != null) {
                leadDao.updateLead(lead.copy(status = "SKIPPED"))
                Log.d("AutoDialerManager", "Skipped lead ${lead.name}")
            }
            callManager.endCurrentCall()
            if (_uiState.value.status == DialerStatus.RUNNING) {
                dialNextLead()
            } else {
                refreshCampaignState(_uiState.value.campaignId)
            }
        }
    }

    fun stopCampaign() {
        _uiState.value = _uiState.value.copy(
            status = DialerStatus.STOPPED,
            currentLead = null
        )
        callManager.endCurrentCall()
        callManager.resetStateToIdle()
    }

    fun endCurrentCall() {
        callManager.endCurrentCall()
    }

    private suspend fun dialNextLead() {
        withContext(Dispatchers.IO) {
            if (_uiState.value.status != DialerStatus.RUNNING) return@withContext

            refreshCampaignState(_uiState.value.campaignId)
            val leadToDial = leadDao.getNextReadyLead(_uiState.value.campaignId)

            if (leadToDial == null) {
                Log.d("AutoDialerManager", "No more ready leads in campaign. Stopping dialer.")
                _uiState.value = _uiState.value.copy(
                    status = DialerStatus.STOPPED,
                    currentLead = null,
                    nextLead = null
                )
                return@withContext
            }

            val updatedLead = leadToDial.copy(
                status = "DIALING",
                attempts = leadToDial.attempts + 1,
                lastAttemptAt = System.currentTimeMillis(),
                callStartedAt = System.currentTimeMillis(),
                simUsed = "SIM ${_uiState.value.selectedSimSlot + 1}"
            )
            leadDao.updateLead(updatedLead)

            val peekNextLead = leadDao.getNextReadyLead(_uiState.value.campaignId)

            _uiState.value = _uiState.value.copy(
                currentLead = updatedLead,
                nextLead = peekNextLead
            )

            val handle: PhoneAccountHandle? = simManager.getSelectedPhoneAccountHandle(_uiState.value.selectedSimSlot)
            callManager.resetStateToIdle()
            val success = callManager.placeSimCall(context, updatedLead.phoneNumber, handle)

            if (!success) {
                Log.e("AutoDialerManager", "Failed to place call to ${updatedLead.phoneNumber}")
                leadDao.updateLead(updatedLead.copy(status = "FAILED", failureReason = "PLACEMENT_FAILED"))
                if (_uiState.value.status == DialerStatus.RUNNING) {
                    delay(_uiState.value.delaySeconds * 1000L)
                    dialNextLead()
                }
            }
        }
    }

    private fun onCallDisconnected(duration: Long, cause: String) {
        coroutineScope.launch {
            val lead = _uiState.value.currentLead
            if (lead != null) {
                val finalStatus = when {
                    duration > 3 -> "COMPLETED"
                    cause.contains("BUSY", ignoreCase = true) -> "BUSY"
                    cause.contains("NO_ANSWER", ignoreCase = true) -> "NO_ANSWER"
                    else -> "COMPLETED"
                }

                val recPath = callManager.callState.value.recordingPath
                leadDao.updateLead(
                    lead.copy(
                        status = finalStatus,
                        callEndedAt = System.currentTimeMillis(),
                        durationSeconds = duration,
                        failureReason = if (recPath.isNotEmpty()) recPath else (if (finalStatus == "COMPLETED") null else cause)
                    )
                )
                Log.d("AutoDialerManager", "Lead ${lead.name} marked as $finalStatus. Duration: ${duration}s, Recording: $recPath")
            }

            refreshCampaignState(_uiState.value.campaignId)

            if (_uiState.value.status == DialerStatus.RUNNING) {
                _uiState.value = _uiState.value.copy(status = DialerStatus.COOLDOWN)
                delay(_uiState.value.delaySeconds * 1000L)

                if (_uiState.value.status == DialerStatus.COOLDOWN) {
                    _uiState.value = _uiState.value.copy(status = DialerStatus.RUNNING)
                    dialNextLead()
                }
            } else {
                callManager.resetStateToIdle()
            }
        }
    }

    suspend fun resetCampaignLeads(campaignId: String = "pune_leads") {
        withContext(Dispatchers.IO) {
            leadDao.resetCampaignStatus(campaignId)
            refreshCampaignState(campaignId)
            Log.d("AutoDialerManager", "Reset all leads to READY for campaign $campaignId")
        }
    }

    suspend fun loadDemoLeadsIfEmpty(campaignId: String = "pune_leads") {
        withContext(Dispatchers.IO) {
            val count = leadDao.getTotalCount(campaignId)
            if (count == 0) {
                val demoLeads = listOf(
                    LeadEntity("lead_1", "Rahul Sharma", "+919876543210", campaignId, 10, "READY"),
                    LeadEntity("lead_2", "Amit Patel", "+919876543211", campaignId, 9, "READY"),
                    LeadEntity("lead_3", "Priya Shah", "+919876543212", campaignId, 8, "READY"),
                    LeadEntity("lead_4", "Vikram Malhotra", "+919876543213", campaignId, 7, "READY"),
                    LeadEntity("lead_5", "Neha Verma", "+919876543214", campaignId, 6, "READY"),
                    LeadEntity("lead_6", "Suresh Gupta", "+919876543215", campaignId, 5, "READY"),
                    LeadEntity("lead_7", "Ananya Joshi", "+919876543216", campaignId, 4, "READY"),
                    LeadEntity("lead_8", "Rohan Mehta", "+919876543217", campaignId, 3, "READY"),
                    LeadEntity("lead_9", "Kavita Rao", "+919876543218", campaignId, 2, "READY"),
                    LeadEntity("lead_10", "Rajesh Deshmukh", "+919876543219", campaignId, 1, "READY"),
                    LeadEntity("lead_real_1", "Test Lead 1", "+919049111890", campaignId, 0, "READY"),
                    LeadEntity("lead_real_2", "Test Lead 2", "+919284980123", campaignId, -1, "READY")
                )
                leadDao.insertLeads(demoLeads)
                Log.d("AutoDialerManager", "Inserted demo leads into campaign $campaignId")
            } else {
                // If all leads are completed/skipped, reset them back to READY for fresh queue runs
                val readyCount = leadDao.getNextReadyLead(campaignId)
                if (readyCount == null) {
                    resetCampaignLeads(campaignId)
                }
            }
            refreshCampaignState(campaignId)
        }
    }
}
