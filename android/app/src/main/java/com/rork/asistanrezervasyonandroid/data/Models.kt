package com.rork.asistanrezervasyonandroid.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// MARK: Client User

@Serializable
data class ClientUser(
    val id: String,
    val authUserId: String? = null,
    val fullName: String,
    val phone: String? = null,
    val email: String? = null,
    val locationLat: Double? = null,
    val locationLng: Double? = null,
    val address: String? = null,
    val city: String? = null,
) {
    val hasLocation: Boolean get() = locationLat != null && locationLng != null
}

// MARK: Catalog / Providers

@Serializable
data class ServiceItem(
    val id: String,
    val name: String,
    val category: String? = null,
    val durationMin: Int,
    val price: Double,
    val currency: String = "TRY",
    val description: String? = null,
)

@Serializable
data class NextSlot(
    val date: String,
    val startTime: String,
)

@Serializable
data class Provider(
    val staffId: String,
    val doctorName: String,
    val specialty: String? = null,
    val bio: String? = null,
    val color: String = "0FB9A8",
    val businessId: String,
    val clinicName: String,
    val city: String? = null,
    val address: String? = null,
    val logoUrl: String? = null,
    val primaryColor: String = "0FB9A8",
    val currency: String = "TRY",
    val autoConfirm: Boolean = false,
    val distanceKm: Double? = null,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val serviceCount: Int = 0,
    val services: List<ServiceItem> = emptyList(),
    val priceMin: Double? = null,
    val priceMax: Double? = null,
    val isOpenNow: Boolean = false,
    val nextAvailable: NextSlot? = null,
)

@Serializable
data class PopularService(
    val name: String,
    val count: Int,
    val category: String? = null,
)

@Serializable
data class ReviewItem(
    val id: String,
    val rating: Int,
    val comment: String? = null,
    val serviceQuality: Int? = null,
    val waitingTime: Int? = null,
    val communication: Int? = null,
    val createdAt: String,
    val staffId: String? = null,
)

@Serializable
data class ClinicInfo(
    val id: String,
    val name: String,
    val description: String? = null,
    val city: String? = null,
    val address: String? = null,
    val phone: String? = null,
    val logoUrl: String? = null,
    val primaryColor: String? = null,
    val currency: String? = null,
    val distanceKm: Double? = null,
)

@Serializable
data class SlotItem(
    val startTime: String,
    val endTime: String,
)

// MARK: Appointments

@Serializable
data class NamedDuration(
    val name: String,
    val durationMin: Int? = null,
)

@Serializable
data class DoctorBrief(
    val fullName: String,
    val specialty: String? = null,
)

@Serializable
data class BusinessBrief(
    val name: String,
    val city: String? = null,
    val address: String? = null,
    val phone: String? = null,
    val primaryColor: String? = null,
    val logoUrl: String? = null,
)

@Serializable
data class AppointmentRow(
    val id: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val status: String,
    val source: String = "",
    val price: Double? = null,
    val notes: String? = null,
    val createdAt: String = "",
    val businessId: String,
    val hasReview: Boolean = false,
    @SerialName("Service") val service: NamedDuration? = null,
    @SerialName("TeamMember") val teamMember: DoctorBrief? = null,
    @SerialName("Business") val business: BusinessBrief? = null,
)

// MARK: Notifications

@Serializable
data class NotificationBusiness(
    val name: String,
    val logoUrl: String? = null,
    val primaryColor: String? = null,
)

@Serializable
data class ClientNotificationItem(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val link: String? = null,
    val isRead: Boolean = false,
    val readAt: String? = null,
    val createdAt: String = "",
    val appointmentId: String? = null,
    val businessId: String? = null,
    @SerialName("Business") val business: NotificationBusiness? = null,
)

// MARK: Response envelopes

@Serializable
data class DiscoveryResponse(
    val nearby: List<Provider> = emptyList(),
    val availableToday: List<Provider> = emptyList(),
    val topRated: List<Provider> = emptyList(),
    val popularServices: List<PopularService> = emptyList(),
)

@Serializable
data class SearchResponse(val providers: List<Provider> = emptyList())

@Serializable
data class ClinicResponse(
    val business: ClinicInfo? = null,
    val doctors: List<Provider> = emptyList(),
    val reviews: List<ReviewItem> = emptyList(),
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
)

@Serializable
data class DoctorResponse(
    val doctor: Provider? = null,
    val reviews: List<ReviewItem> = emptyList(),
)

@Serializable
data class SlotsResponse(val slots: List<SlotItem> = emptyList())

@Serializable
data class AppointmentsResponse(val appointments: List<AppointmentRow> = emptyList())

@Serializable
data class NotificationsResponse(
    val notifications: List<ClientNotificationItem> = emptyList(),
    val unread: Int = 0,
)

@Serializable
data class ClientUserResponse(val clientUser: ClientUser? = null)

@Serializable
data class BookingResponse(
    val ok: Boolean = false,
    val appointmentId: String = "",
    val status: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val date: String = "",
)

@Serializable
data class OkResponse(val ok: Boolean = false)

@Serializable
data class RegisterResponse(val ok: Boolean = false, val clientUserId: String? = null)

// MARK: Appointment status helpers

enum class AppointmentStatus(val raw: String, val label: String) {
    SCHEDULED("SCHEDULED", "Onay bekliyor"),
    CONFIRMED("CONFIRMED", "Onaylandı"),
    COMPLETED("COMPLETED", "Tamamlandı"),
    CANCELLED("CANCELLED", "İptal edildi"),
    NO_SHOW("NO_SHOW", "Gelinmedi");

    companion object {
        fun from(raw: String): AppointmentStatus? = entries.firstOrNull { it.raw == raw }
    }
}
