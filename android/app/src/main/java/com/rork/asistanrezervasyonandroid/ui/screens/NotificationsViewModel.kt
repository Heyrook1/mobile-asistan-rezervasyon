package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.ClientNotificationItem
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Shared across tabs so the bottom bar badge stays close to real time. */
class NotificationsViewModel : ViewModel() {
    private val _notifications = MutableStateFlow<List<ClientNotificationItem>>(emptyList())
    val notifications: StateFlow<List<ClientNotificationItem>> = _notifications.asStateFlow()

    private val _unread = MutableStateFlow(0)
    val unread: StateFlow<Int> = _unread.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var loaded = false
    private var pollJob: Job? = null

    fun loadIfNeeded() {
        viewModelScope.launch {
            if (!loaded) load()
            startPolling()
        }
    }

    suspend fun load() {
        try {
            val res = ApiService.notifications()
            _notifications.value = res.notifications
            _unread.value = res.unread
            loaded = true
        } catch (_: Exception) {
            // Silent — polling retries.
        }
        _isLoading.value = false
    }

    /**
     * Lightweight foreground polling keeps the badge + list close to real time
     * so dashboard approvals/cancellations surface quickly.
     */
    private fun startPolling() {
        if (pollJob != null) return
        pollJob = viewModelScope.launch {
            while (isActive) {
                delay(25_000)
                load()
            }
        }
    }

    fun markRead(item: ClientNotificationItem) {
        if (item.isRead) return
        viewModelScope.launch {
            runCatching { ApiService.markRead(item.id) }
            load()
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            runCatching { ApiService.markAllRead() }
            load()
        }
    }
}
