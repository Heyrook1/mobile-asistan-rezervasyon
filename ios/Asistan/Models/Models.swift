import Foundation

// MARK: - Client User

nonisolated struct ClientUser: Codable, Sendable, Identifiable {
    let id: String
    let authUserId: String?
    let fullName: String
    let phone: String?
    let email: String?
    let locationLat: Double?
    let locationLng: Double?
    let address: String?
    let city: String?

    var hasLocation: Bool { locationLat != nil && locationLng != nil }
}

// MARK: - Catalog / Providers

nonisolated struct ServiceItem: Codable, Sendable, Identifiable {
    let id: String
    let name: String
    let category: String?
    let durationMin: Int
    let price: Double
    let currency: String
    let description: String?
}

nonisolated struct NextSlot: Codable, Sendable {
    let date: String
    let startTime: String
}

nonisolated struct Provider: Codable, Sendable, Identifiable {
    var id: String { staffId }
    let staffId: String
    let doctorName: String
    let specialty: String?
    let bio: String?
    let color: String
    let businessId: String
    let clinicName: String
    let city: String?
    let address: String?
    let logoUrl: String?
    let primaryColor: String
    let currency: String
    let autoConfirm: Bool
    let distanceKm: Double?
    let rating: Double
    let reviewCount: Int
    let serviceCount: Int
    let services: [ServiceItem]
    let priceMin: Double?
    let priceMax: Double?
    let isOpenNow: Bool
    let nextAvailable: NextSlot?
}

nonisolated struct PopularService: Codable, Sendable, Identifiable {
    var id: String { name }
    let name: String
    let count: Int
    let category: String?
}

nonisolated struct ReviewItem: Codable, Sendable, Identifiable {
    let id: String
    let rating: Int
    let comment: String?
    let serviceQuality: Int?
    let waitingTime: Int?
    let communication: Int?
    let createdAt: String
    let staffId: String?
}

nonisolated struct ClinicInfo: Codable, Sendable {
    let id: String
    let name: String
    let description: String?
    let city: String?
    let address: String?
    let phone: String?
    let logoUrl: String?
    let primaryColor: String?
    let currency: String?
    let distanceKm: Double?
}

nonisolated struct SlotItem: Codable, Sendable, Identifiable {
    var id: String { startTime }
    let startTime: String
    let endTime: String
}

// MARK: - Appointments

nonisolated struct NamedDuration: Codable, Sendable {
    let name: String
    let durationMin: Int?
}

nonisolated struct DoctorBrief: Codable, Sendable {
    let fullName: String
    let specialty: String?
}

nonisolated struct BusinessBrief: Codable, Sendable {
    let name: String
    let city: String?
    let address: String?
    let phone: String?
    let primaryColor: String?
    let logoUrl: String?
}

nonisolated struct AppointmentRow: Codable, Sendable, Identifiable {
    let id: String
    let date: String
    let startTime: String
    let endTime: String
    let status: String
    let source: String
    let price: Double?
    let notes: String?
    let createdAt: String
    let businessId: String
    let hasReview: Bool
    let service: NamedDuration?
    let teamMember: DoctorBrief?
    let business: BusinessBrief?

    enum CodingKeys: String, CodingKey {
        case id, date, startTime, endTime, status, source, price, notes, createdAt, businessId, hasReview
        case service = "Service"
        case teamMember = "TeamMember"
        case business = "Business"
    }
}

// MARK: - Notifications

nonisolated struct NotificationBusiness: Codable, Sendable {
    let name: String
    let logoUrl: String?
    let primaryColor: String?
}

nonisolated struct ClientNotificationItem: Codable, Sendable, Identifiable {
    let id: String
    let type: String
    let title: String
    let message: String
    let link: String?
    let isRead: Bool
    let readAt: String?
    let createdAt: String
    let appointmentId: String?
    let businessId: String?
    let business: NotificationBusiness?

    enum CodingKeys: String, CodingKey {
        case id, type, title, message, link, isRead, readAt, createdAt, appointmentId, businessId
        case business = "Business"
    }
}

// MARK: - Response envelopes

nonisolated struct DiscoveryResponse: Codable, Sendable {
    let nearby: [Provider]
    let availableToday: [Provider]
    let topRated: [Provider]
    let popularServices: [PopularService]
}

nonisolated struct SearchResponse: Codable, Sendable {
    let providers: [Provider]
}

nonisolated struct ClinicResponse: Codable, Sendable {
    let business: ClinicInfo?
    let doctors: [Provider]
    let reviews: [ReviewItem]
    let rating: Double
    let reviewCount: Int
}

nonisolated struct DoctorResponse: Codable, Sendable {
    let doctor: Provider?
    let reviews: [ReviewItem]
}

nonisolated struct SlotsResponse: Codable, Sendable {
    let slots: [SlotItem]
}

nonisolated struct AppointmentsResponse: Codable, Sendable {
    let appointments: [AppointmentRow]
}

nonisolated struct NotificationsResponse: Codable, Sendable {
    let notifications: [ClientNotificationItem]
    let unread: Int
}

nonisolated struct ClientUserResponse: Codable, Sendable {
    let clientUser: ClientUser?
}

nonisolated struct BookingResponse: Codable, Sendable {
    let ok: Bool
    let appointmentId: String
    let status: String
    let startTime: String
    let endTime: String
    let date: String
}

nonisolated struct OkResponse: Codable, Sendable {
    let ok: Bool
}

nonisolated struct RegisterResponse: Codable, Sendable {
    let ok: Bool
    let clientUserId: String?
}

// MARK: - Appointment status helpers

nonisolated enum AppointmentStatus: String {
    case scheduled = "SCHEDULED"
    case confirmed = "CONFIRMED"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
    case noShow = "NO_SHOW"

    var label: String {
        switch self {
        case .scheduled: return "Onay bekliyor"
        case .confirmed: return "Onaylandı"
        case .completed: return "Tamamlandı"
        case .cancelled: return "İptal edildi"
        case .noShow: return "Gelinmedi"
        }
    }
}
