package com.shoption.calltracker.telecom

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log

data class SimCardInfo(
    val slotIndex: Int,
    val subscriptionId: Int,
    val displayName: String,
    val carrierName: String,
    val number: String,
    val phoneAccountHandleId: String?
)

class SimManager(private val context: Context) {
    private val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager

    @SuppressLint("MissingPermission")
    fun getAvailableSimCards(): List<SimCardInfo> {
        val result = mutableListOf<SimCardInfo>()
        try {
            val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val subList: List<SubscriptionInfo>? = subscriptionManager?.activeSubscriptionInfoList

            val callAccountHandles: List<PhoneAccountHandle> = try {
                telecomManager.callCapablePhoneAccounts
            } catch (e: Exception) {
                emptyList()
            }

            if (!subList.isNullOrEmpty()) {
                for (sub in subList) {
                    val matchingHandle = callAccountHandles.find { handle ->
                        handle.id.contains(sub.subscriptionId.toString()) ||
                        handle.id == sub.iccId
                    } ?: callAccountHandles.getOrNull(sub.simSlotIndex)

                    result.add(
                        SimCardInfo(
                            slotIndex = sub.simSlotIndex,
                            subscriptionId = sub.subscriptionId,
                            displayName = sub.displayName?.toString() ?: "SIM ${sub.simSlotIndex + 1}",
                            carrierName = sub.carrierName?.toString() ?: "Unknown Carrier",
                            number = sub.number ?: "",
                            phoneAccountHandleId = matchingHandle?.id ?: sub.subscriptionId.toString()
                        )
                    )
                }
            } else if (callAccountHandles.isNotEmpty()) {
                callAccountHandles.forEachIndexed { index, handle ->
                    result.add(
                        SimCardInfo(
                            slotIndex = index,
                            subscriptionId = index,
                            displayName = "SIM ${index + 1}",
                            carrierName = handle.componentName.shortClassName,
                            number = "",
                            phoneAccountHandleId = handle.id
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.e("SimManager", "Error discovering SIM cards", e)
        }

        // Fallback default entry if no SIM discovered in emulator/test environment
        if (result.isEmpty()) {
            result.add(
                SimCardInfo(
                    slotIndex = 0,
                    subscriptionId = 0,
                    displayName = "SIM 1 (Default)",
                    carrierName = "Cellular SIM",
                    number = "",
                    phoneAccountHandleId = null
                )
            )
        }

        return result
    }

    @SuppressLint("MissingPermission")
    fun getSelectedPhoneAccountHandle(selectedSimSlot: Int): PhoneAccountHandle? {
        val handles = try {
            telecomManager.callCapablePhoneAccounts
        } catch (e: Exception) {
            emptyList()
        }

        if (handles.isEmpty()) return null

        val availableSims = getAvailableSimCards()
        val targetSim = availableSims.find { it.slotIndex == selectedSimSlot } ?: availableSims.firstOrNull()

        if (targetSim?.phoneAccountHandleId != null) {
            val handleMatch = handles.find { it.id == targetSim.phoneAccountHandleId }
            if (handleMatch != null) return handleMatch
        }

        return handles.getOrNull(selectedSimSlot) ?: handles.firstOrNull()
    }
}
