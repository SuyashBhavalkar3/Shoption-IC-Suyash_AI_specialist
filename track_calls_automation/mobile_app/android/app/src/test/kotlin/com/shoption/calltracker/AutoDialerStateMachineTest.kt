package com.shoption.calltracker.autodialer

import org.junit.Assert.*
import org.junit.Test

class AutoDialerStateMachineTest {

    @Test
    fun testInitialStateIsIdle() {
        val state = AutoDialerState()
        assertEquals(DialerStatus.IDLE, state.status)
        assertEquals("pune_leads", state.campaignId)
        assertEquals(0, state.totalLeads)
    }

    @Test
    fun testStateTransitionToRunning() {
        val initialState = AutoDialerState()
        val runningState = initialState.copy(
            status = DialerStatus.RUNNING,
            campaignId = "pune_leads",
            selectedSimSlot = 0,
            delaySeconds = 2
        )
        assertEquals(DialerStatus.RUNNING, runningState.status)
        assertEquals(2, runningState.delaySeconds)
        assertEquals(0, runningState.selectedSimSlot)
    }

    @Test
    fun testStateTransitionToPaused() {
        val runningState = AutoDialerState(status = DialerStatus.RUNNING)
        val pausedState = runningState.copy(status = DialerStatus.PAUSED)
        assertEquals(DialerStatus.PAUSED, pausedState.status)
    }

    @Test
    fun testStateTransitionToStopped() {
        val runningState = AutoDialerState(status = DialerStatus.RUNNING)
        val stoppedState = runningState.copy(status = DialerStatus.STOPPED, currentLead = null)
        assertEquals(DialerStatus.STOPPED, stoppedState.status)
        assertNull(stoppedState.currentLead)
    }
}
