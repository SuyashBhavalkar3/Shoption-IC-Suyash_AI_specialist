package com.shoption.calltracker.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class LeadDao(private val dbHelper: DialerDatabaseHelper) {

    fun getLeadsForCampaign(campaignId: String): List<LeadEntity> {
        val list = mutableListOf<LeadEntity>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            "leads",
            null,
            "campaignId = ?",
            arrayOf(campaignId),
            null,
            null,
            "priority DESC, id ASC"
        )
        cursor.use {
            while (it.moveToNext()) {
                list.add(cursorToLead(it))
            }
        }
        return list
    }

    fun getNextReadyLead(campaignId: String): LeadEntity? {
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            "leads",
            null,
            "campaignId = ? AND status IN ('READY', 'RETRY_PENDING')",
            arrayOf(campaignId),
            null,
            null,
            "priority DESC, id ASC",
            "1"
        )
        cursor.use {
            if (it.moveToFirst()) {
                return cursorToLead(it)
            }
        }
        return null
    }

    fun getTotalCount(campaignId: String): Int = getCount(campaignId, null)
    fun getCompletedCount(campaignId: String): Int = getCount(campaignId, "COMPLETED")
    fun getNoAnswerCount(campaignId: String): Int = getCount(campaignId, "NO_ANSWER")
    fun getBusyCount(campaignId: String): Int = getCount(campaignId, "BUSY")
    fun getFailedCount(campaignId: String): Int = getCount(campaignId, "FAILED")
    fun getSkippedCount(campaignId: String): Int = getCount(campaignId, "SKIPPED")

    private fun getCount(campaignId: String, status: String?): Int {
        val db = dbHelper.readableDatabase
        val selection = if (status == null) "campaignId = ?" else "campaignId = ? AND status = ?"
        val args = if (status == null) arrayOf(campaignId) else arrayOf(campaignId, status)
        val cursor = db.rawQuery("SELECT COUNT(*) FROM leads WHERE $selection", args)
        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }
        return 0
    }

    fun insertLeads(leads: List<LeadEntity>) {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            for (lead in leads) {
                val cv = ContentValues().apply {
                    put("id", lead.id)
                    put("name", lead.name)
                    put("phoneNumber", lead.phoneNumber)
                    put("campaignId", lead.campaignId)
                    put("priority", lead.priority)
                    put("status", lead.status)
                    put("attempts", lead.attempts)
                    put("lastAttemptAt", lead.lastAttemptAt)
                    put("callStartedAt", lead.callStartedAt)
                    put("callEndedAt", lead.callEndedAt)
                    put("durationSeconds", lead.durationSeconds)
                    put("failureReason", lead.failureReason)
                    put("simUsed", lead.simUsed)
                }
                db.insertWithOnConflict("leads", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun updateLead(lead: LeadEntity) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("name", lead.name)
            put("phoneNumber", lead.phoneNumber)
            put("campaignId", lead.campaignId)
            put("priority", lead.priority)
            put("status", lead.status)
            put("attempts", lead.attempts)
            put("lastAttemptAt", lead.lastAttemptAt)
            put("callStartedAt", lead.callStartedAt)
            put("callEndedAt", lead.callEndedAt)
            put("durationSeconds", lead.durationSeconds)
            put("failureReason", lead.failureReason)
            put("simUsed", lead.simUsed)
        }
        db.update("leads", cv, "id = ?", arrayOf(lead.id))
    }

    fun resetCampaignStatus(campaignId: String) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("status", "READY")
            put("attempts", 0)
            putNull("failureReason")
        }
        db.update("leads", cv, "campaignId = ?", arrayOf(campaignId))
    }

    private fun cursorToLead(c: android.database.Cursor): LeadEntity {
        return LeadEntity(
            id = c.getString(c.getColumnIndexOrThrow("id")),
            name = c.getString(c.getColumnIndexOrThrow("name")),
            phoneNumber = c.getString(c.getColumnIndexOrThrow("phoneNumber")),
            campaignId = c.getString(c.getColumnIndexOrThrow("campaignId")),
            priority = c.getInt(c.getColumnIndexOrThrow("priority")),
            status = c.getString(c.getColumnIndexOrThrow("status")),
            attempts = c.getInt(c.getColumnIndexOrThrow("attempts")),
            lastAttemptAt = if (c.isNull(c.getColumnIndexOrThrow("lastAttemptAt"))) null else c.getLong(c.getColumnIndexOrThrow("lastAttemptAt")),
            callStartedAt = if (c.isNull(c.getColumnIndexOrThrow("callStartedAt"))) null else c.getLong(c.getColumnIndexOrThrow("callStartedAt")),
            callEndedAt = if (c.isNull(c.getColumnIndexOrThrow("callEndedAt"))) null else c.getLong(c.getColumnIndexOrThrow("callEndedAt")),
            durationSeconds = c.getLong(c.getColumnIndexOrThrow("durationSeconds")),
            failureReason = if (c.isNull(c.getColumnIndexOrThrow("failureReason"))) null else c.getString(c.getColumnIndexOrThrow("failureReason")),
            simUsed = if (c.isNull(c.getColumnIndexOrThrow("simUsed"))) null else c.getString(c.getColumnIndexOrThrow("simUsed"))
        )
    }
}
