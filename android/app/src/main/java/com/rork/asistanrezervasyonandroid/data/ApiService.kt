package com.rork.asistanrezervasyonandroid.data

import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Serializable
private data class ErrorBody(
    val error: String? = null,
    val message: String? = null,
)

/** Search filters mirroring the iOS SearchFilters payload. */
data class SearchFilters(
    val specialty: String? = null,
    val service: String? = null,
    val maxDistanceKm: Double? = null,
    val minRating: Double? = null,
    val availableToday: Boolean? = null,
    val maxPrice: Double? = null,
    val clinicName: String? = null,
    val doctorName: String? = null,
) {
    val activeCount: Int
        get() {
            var n = 0
            if (specialty != null) n++
            if (service != null) n++
            if (maxDistanceKm != null) n++
            if (minRating != null) n++
            if (availableToday == true) n++
            if (maxPrice != null) n++
            return n
        }

    fun toJson(): JsonObject = buildJsonObject {
        specialty?.let { put("specialty", it) }
        service?.let { put("service", it) }
        maxDistanceKm?.let { put("maxDistanceKm", it) }
        minRating?.let { put("minRating", it) }
        availableToday?.let { put("availableToday", it) }
        maxPrice?.let { put("maxPrice", it) }
        clinicName?.let { put("clinicName", it) }
        doctorName?.let { put("doctorName", it) }
    }
}

/**
 * Thin wrapper over Supabase Edge Functions. Decodes responses and surfaces
 * backend Turkish error messages instead of opaque HTTP failures.
 */
object ApiService {

    private suspend inline fun <reified T> invoke(name: String, body: JsonObject): T {
        val token = AppGraph.auth.validAccessToken() ?: Env.supabaseAnonKey
        val text: String
        val statusCode: Int
        try {
            val res = AppGraph.http.post("${Env.supabaseUrl}/functions/v1/$name") {
                header("apikey", Env.supabaseAnonKey)
                header("Authorization", "Bearer $token")
                contentType(ContentType.Application.Json)
                setBody(body.toString())
            }
            statusCode = res.status.value
            text = res.bodyAsText()
        } catch (e: ApiException) {
            throw e
        } catch (_: Exception) {
            throw ApiException("Bağlantı hatası. İnternet bağlantınızı kontrol edin.")
        }
        if (statusCode !in 200..299) {
            val parsed = runCatching { AppJson.decodeFromString<ErrorBody>(text) }.getOrNull()
            throw ApiException(
                parsed?.message ?: "İşlem tamamlanamadı ($statusCode). Lütfen tekrar deneyin."
            )
        }
        return try {
            AppJson.decodeFromString<T>(text)
        } catch (_: Exception) {
            throw ApiException("Beklenmeyen yanıt alındı. Lütfen tekrar deneyin.")
        }
    }

    // MARK: Auth / Profile

    suspend fun register(fullName: String, email: String, phone: String, password: String) {
        invoke<RegisterResponse>("auth-client", buildJsonObject {
            put("action", "register")
            put("fullName", fullName)
            put("email", email)
            put("phone", phone)
            put("password", password)
        })
    }

    suspend fun getProfile(fullName: String? = null, phone: String? = null): ClientUser? {
        val res = invoke<ClientUserResponse>("auth-client", buildJsonObject {
            put("action", "get")
            put("metadata", buildJsonObject {
                fullName?.let { put("fullName", it) }
                phone?.let { put("phone", it) }
            })
        })
        return res.clientUser
    }

    suspend fun updateProfile(
        fullName: String? = null,
        phone: String? = null,
        address: String? = null,
        city: String? = null,
        locationLat: Double? = null,
        locationLng: Double? = null,
    ): ClientUser? {
        val res = invoke<ClientUserResponse>("auth-client", buildJsonObject {
            put("action", "update")
            fullName?.let { put("fullName", it) }
            phone?.let { put("phone", it) }
            address?.let { put("address", it) }
            city?.let { put("city", it) }
            locationLat?.let { put("locationLat", it) }
            locationLng?.let { put("locationLng", it) }
        })
        return res.clientUser
    }

    // MARK: Catalog

    suspend fun discovery(lat: Double?, lng: Double?): DiscoveryResponse =
        invoke("catalog", buildJsonObject {
            put("action", "discovery")
            lat?.let { put("lat", it) }
            lng?.let { put("lng", it) }
        })

    suspend fun search(
        lat: Double?,
        lng: Double?,
        query: String?,
        filters: SearchFilters,
        sort: String,
    ): List<Provider> {
        val res = invoke<SearchResponse>("catalog", buildJsonObject {
            put("action", "search")
            lat?.let { put("lat", it) }
            lng?.let { put("lng", it) }
            query?.let { put("query", it) }
            put("filters", filters.toJson())
            put("sort", sort)
        })
        return res.providers
    }

    suspend fun clinic(businessId: String, lat: Double?, lng: Double?): ClinicResponse =
        invoke("catalog", buildJsonObject {
            put("action", "clinic")
            put("businessId", businessId)
            lat?.let { put("lat", it) }
            lng?.let { put("lng", it) }
        })

    suspend fun doctor(staffId: String, lat: Double?, lng: Double?): DoctorResponse =
        invoke("catalog", buildJsonObject {
            put("action", "doctor")
            put("staffId", staffId)
            lat?.let { put("lat", it) }
            lng?.let { put("lng", it) }
        })

    suspend fun slots(staffId: String, serviceId: String, date: String): List<SlotItem> {
        val res = invoke<SlotsResponse>("catalog", buildJsonObject {
            put("action", "slots")
            put("staffId", staffId)
            put("serviceId", serviceId)
            put("date", date)
        })
        return res.slots
    }

    // MARK: Booking

    suspend fun book(
        businessId: String,
        staffId: String,
        serviceId: String,
        date: String,
        startTime: String,
        note: String?,
        contactPhone: String?,
    ): BookingResponse = invoke("booking", buildJsonObject {
        put("action", "book")
        put("businessId", businessId)
        put("staffId", staffId)
        put("serviceId", serviceId)
        put("date", date)
        put("startTime", startTime)
        note?.let { put("note", it) }
        contactPhone?.let { put("contactPhone", it) }
    })

    suspend fun myAppointments(): List<AppointmentRow> {
        val res = invoke<AppointmentsResponse>("booking", buildJsonObject { put("action", "list") })
        return res.appointments
    }

    suspend fun cancel(appointmentId: String) {
        invoke<OkResponse>("booking", buildJsonObject {
            put("action", "cancel")
            put("appointmentId", appointmentId)
        })
    }

    // MARK: Engagement

    suspend fun notifications(): NotificationsResponse =
        invoke("engagement", buildJsonObject { put("action", "notifications") })

    suspend fun markRead(id: String) {
        invoke<OkResponse>("engagement", buildJsonObject {
            put("action", "mark_read")
            put("id", id)
        })
    }

    suspend fun markAllRead() {
        invoke<OkResponse>("engagement", buildJsonObject { put("action", "mark_all_read") })
    }

    suspend fun submitReview(
        appointmentId: String,
        rating: Int,
        comment: String?,
        serviceQuality: Int?,
        waitingTime: Int?,
        communication: Int?,
    ) {
        invoke<OkResponse>("engagement", buildJsonObject {
            put("action", "review")
            put("appointmentId", appointmentId)
            put("rating", rating)
            comment?.let { put("comment", it) }
            serviceQuality?.let { put("serviceQuality", it) }
            waitingTime?.let { put("waitingTime", it) }
            communication?.let { put("communication", it) }
        })
    }
}
