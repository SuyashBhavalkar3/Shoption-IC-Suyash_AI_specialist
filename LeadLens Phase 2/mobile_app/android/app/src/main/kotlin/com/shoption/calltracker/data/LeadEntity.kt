package com.shoption.calltracker.data

data class LeadEntity(
    val id: String,
    val name: String,
    val phoneNumber: String,
    val campaignId: String,
    val priority: Int = 0,
    val status: String = "READY", // READY, DIALING, RINGING, CONNECTED, COMPLETED, NO_ANSWER, BUSY, FAILED, SKIPPED, RETRY_PENDING
    val attempts: Int = 0,
    val lastAttemptAt: Long? = null,
    val callStartedAt: Long? = null,
    val callEndedAt: Long? = null,
    val durationSeconds: Long = 0,
    val failureReason: String? = null,
    val simUsed: String? = null
)

