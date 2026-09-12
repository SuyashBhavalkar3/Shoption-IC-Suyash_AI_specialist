package com.shoption.calltracker.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DialerDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE leads (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phoneNumber TEXT NOT NULL,
                campaignId TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'READY',
                attempts INTEGER NOT NULL DEFAULT 0,
                lastAttemptAt INTEGER,
                callStartedAt INTEGER,
                callEndedAt INTEGER,
                durationSeconds INTEGER NOT NULL DEFAULT 0,
                failureReason TEXT,
                simUsed TEXT
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS leads")
        onCreate(db)
    }

    companion object {
        private const val DATABASE_NAME = "autodialer_db.db"
        private const val DATABASE_VERSION = 2

        @Volatile
        private var INSTANCE: DialerDatabaseHelper? = null

        fun getInstance(context: Context): DialerDatabaseHelper {
            return INSTANCE ?: synchronized(this) {
                val instance = DialerDatabaseHelper(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }
    }
}

class DialerDatabase(context: Context) {
    private val dbHelper = DialerDatabaseHelper.getInstance(context)
    private val dao = LeadDao(dbHelper)

    fun leadDao(): LeadDao = dao

    companion object {
        fun getDatabase(context: Context): DialerDatabase {
            return DialerDatabase(context)
        }
    }
}
