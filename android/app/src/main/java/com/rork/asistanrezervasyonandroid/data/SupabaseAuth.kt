package com.rork.asistanrezervasyonandroid.data

import android.content.Context
import android.content.SharedPreferences
import com.rork.asistanrezervasyonandroid.Config
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** User-facing error carrying a Turkish message from the backend. */
class ApiException(message: String) : Exception(message)

val AppJson = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    coerceInputValues = true
    isLenient = true
}

object Env {
    val supabaseUrl: String get() = Config.allValues["EXPO_PUBLIC_SUPABASE_URL"]?.trimEnd('/') ?: ""
    val supabaseAnonKey: String get() = Config.allValues["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?: ""
}

/** Persists the Supabase auth session across launches. */
class SessionStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("asistan_session", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString("access_token", null)
        set(value) = prefs.edit().putString("access_token", value).apply()

    var refreshToken: String?
        get() = prefs.getString("refresh_token", null)
        set(value) = prefs.edit().putString("refresh_token", value).apply()

    var expiresAtEpochSec: Long
        get() = prefs.getLong("expires_at", 0L)
        set(value) = prefs.edit().putLong("expires_at", value).apply()

    fun clear() {
        prefs.edit().clear().apply()
    }

    val hasSession: Boolean get() = !refreshToken.isNullOrEmpty()
}

@Serializable
private data class AuthTokenResponse(
    val access_token: String,
    val refresh_token: String,
    val expires_in: Long = 3600,
)

@Serializable
private data class AuthErrorBody(
    val error_description: String? = null,
    val msg: String? = null,
    val error: String? = null,
)

/**
 * Minimal Supabase GoTrue client (email/password) — mirrors the iOS native auth usage.
 * Registration itself goes through the `auth-client` edge function.
 */
class SupabaseAuth(private val store: SessionStore, private val http: HttpClient) {
    private val refreshMutex = Mutex()

    suspend fun signIn(email: String, password: String) {
        val res = http.post("${Env.supabaseUrl}/auth/v1/token?grant_type=password") {
            header("apikey", Env.supabaseAnonKey)
            contentType(ContentType.Application.Json)
            setBody(
                buildJsonObject {
                    put("email", email.trim().lowercase())
                    put("password", password)
                }.toString()
            )
        }
        val text = res.bodyAsText()
        if (res.status.value !in 200..299) {
            val parsed = runCatching { AppJson.decodeFromString<AuthErrorBody>(text) }.getOrNull()
            val raw = parsed?.error_description ?: parsed?.msg ?: ""
            val message = if (raw.contains("Invalid login", ignoreCase = true)) {
                "Giriş başarısız. E-posta veya şifre hatalı."
            } else {
                "Giriş başarısız. Lütfen tekrar deneyin."
            }
            throw ApiException(message)
        }
        applyTokens(AppJson.decodeFromString<AuthTokenResponse>(text))
    }

    /** Returns a valid access token, refreshing if needed. Null when signed out. */
    suspend fun validAccessToken(): String? {
        val refresh = store.refreshToken ?: return null
        val access = store.accessToken
        val nowSec = System.currentTimeMillis() / 1000
        if (access != null && store.expiresAtEpochSec - 60 > nowSec) return access
        return refreshMutex.withLock {
            // Re-check after acquiring the lock — another caller may have refreshed.
            val current = store.accessToken
            if (current != null && store.expiresAtEpochSec - 60 > System.currentTimeMillis() / 1000) {
                return@withLock current
            }
            refreshSession(refresh)
        }
    }

    private suspend fun refreshSession(refreshToken: String): String? {
        return try {
            val res = http.post("${Env.supabaseUrl}/auth/v1/token?grant_type=refresh_token") {
                header("apikey", Env.supabaseAnonKey)
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject { put("refresh_token", refreshToken) }.toString())
            }
            if (res.status.value !in 200..299) {
                store.clear()
                return null
            }
            val tokens = AppJson.decodeFromString<AuthTokenResponse>(res.bodyAsText())
            applyTokens(tokens)
            tokens.access_token
        } catch (_: Exception) {
            // Network hiccup — keep the session, caller surfaces a connectivity error.
            store.accessToken
        }
    }

    private fun applyTokens(tokens: AuthTokenResponse) {
        store.accessToken = tokens.access_token
        store.refreshToken = tokens.refresh_token
        store.expiresAtEpochSec = System.currentTimeMillis() / 1000 + tokens.expires_in
    }

    suspend fun signOut() {
        val token = store.accessToken
        if (token != null) {
            runCatching {
                http.post("${Env.supabaseUrl}/auth/v1/logout") {
                    header("apikey", Env.supabaseAnonKey)
                    header("Authorization", "Bearer $token")
                }
            }
        }
        store.clear()
    }
}

/** Application-wide singletons (session store, http client, auth). */
object AppGraph {
    lateinit var session: SessionStore
        private set

    val http: HttpClient by lazy { HttpClient(Android) }

    val auth: SupabaseAuth by lazy { SupabaseAuth(session, http) }

    fun init(context: Context) {
        if (!::session.isInitialized) {
            session = SessionStore(context.applicationContext)
        }
    }
}
