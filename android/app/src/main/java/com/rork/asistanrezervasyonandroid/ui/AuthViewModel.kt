package com.rork.asistanrezervasyonandroid.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rork.asistanrezervasyonandroid.data.ApiException
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.AppGraph
import com.rork.asistanrezervasyonandroid.data.ClientUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AuthPhase { LOADING, UNAUTHENTICATED, ONBOARDING_LOCATION, READY }

/** Owns auth session + the linked ClientUser profile, and drives top-level routing. */
class AuthViewModel : ViewModel() {
    private val _phase = MutableStateFlow(AuthPhase.LOADING)
    val phase: StateFlow<AuthPhase> = _phase.asStateFlow()

    private val _clientUser = MutableStateFlow<ClientUser?>(null)
    val clientUser: StateFlow<ClientUser?> = _clientUser.asStateFlow()

    private val _isWorking = MutableStateFlow(false)
    val isWorking: StateFlow<Boolean> = _isWorking.asStateFlow()

    private var locationSkippedThisSession = false

    val coordinate: Pair<Double, Double>?
        get() {
            val user = _clientUser.value ?: return null
            val lat = user.locationLat ?: return null
            val lng = user.locationLng ?: return null
            return lat to lng
        }

    fun bootstrap() {
        viewModelScope.launch {
            val token = AppGraph.auth.validAccessToken()
            if (token == null) {
                _phase.value = AuthPhase.UNAUTHENTICATED
            } else {
                loadProfileAndRoute()
            }
        }
    }

    private suspend fun loadProfileAndRoute() {
        try {
            val profile = ApiService.getProfile()
            _clientUser.value = profile
            _phase.value = if (profile != null && (profile.hasLocation || locationSkippedThisSession)) {
                AuthPhase.READY
            } else if (profile == null) {
                AuthPhase.READY
            } else {
                AuthPhase.ONBOARDING_LOCATION
            }
        } catch (_: Exception) {
            // Authenticated but profile fetch failed — still let them in; profile retries later.
            _phase.value = AuthPhase.READY
        }
    }

    /** Throws ApiException with a Turkish message on failure. */
    suspend fun signIn(email: String, password: String) {
        _isWorking.value = true
        try {
            AppGraph.auth.signIn(email.trim().lowercase(), password)
            loadProfileAndRoute()
        } finally {
            _isWorking.value = false
        }
    }

    /** Throws ApiException with a Turkish message on failure. */
    suspend fun register(fullName: String, email: String, phone: String, password: String) {
        _isWorking.value = true
        try {
            val cleanEmail = email.trim().lowercase()
            ApiService.register(fullName, cleanEmail, phone, password)
            AppGraph.auth.signIn(cleanEmail, password)
            _clientUser.value = ApiService.getProfile(fullName = fullName, phone = phone)
            _phase.value = AuthPhase.ONBOARDING_LOCATION
        } finally {
            _isWorking.value = false
        }
    }

    suspend fun saveLocation(lat: Double, lng: Double, city: String?) {
        try {
            _clientUser.value = ApiService.updateProfile(city = city, locationLat = lat, locationLng = lng)
        } catch (_: Exception) {
            // Keep going — location save retries from profile screen.
        }
        _phase.value = AuthPhase.READY
    }

    suspend fun saveCity(city: String, lat: Double?, lng: Double?) {
        try {
            _clientUser.value = ApiService.updateProfile(city = city, locationLat = lat, locationLng = lng)
        } catch (_: Exception) {
            // Keep going — location save retries from profile screen.
        }
        _phase.value = AuthPhase.READY
    }

    fun skipLocation() {
        locationSkippedThisSession = true
        _phase.value = AuthPhase.READY
    }

    fun refreshProfile() {
        viewModelScope.launch {
            runCatching { ApiService.getProfile() }.getOrNull()?.let { _clientUser.value = it }
        }
    }

    fun updateClientUser(user: ClientUser?) {
        if (user != null) _clientUser.value = user
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { AppGraph.auth.signOut() }
            _clientUser.value = null
            locationSkippedThisSession = false
            _phase.value = AuthPhase.UNAUTHENTICATED
        }
    }
}

/** Convenience: run [block] and surface ApiException messages via [onError]. */
suspend fun runCatchingApi(onError: (String) -> Unit, fallback: String, block: suspend () -> Unit) {
    try {
        block()
    } catch (e: ApiException) {
        onError(e.message ?: fallback)
    } catch (_: Exception) {
        onError(fallback)
    }
}
