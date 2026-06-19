import Foundation
import Supabase

/// User-facing error carrying a Turkish message from the backend.
nonisolated struct APIError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

private nonisolated struct ErrorBody: Decodable, Sendable {
    let error: String?
    let message: String?
}

/// Thin wrapper over Supabase Edge Functions. Decodes responses and surfaces
/// backend Turkish error messages instead of opaque HTTP failures.
nonisolated enum APIService {
    private static func invoke<Body: Encodable & Sendable, T: Decodable & Sendable>(
        _ name: String,
        body: Body
    ) async throws -> T {
        do {
            let result: T = try await supabase.functions.invoke(name, options: .init(body: body))
            return result
        } catch let FunctionsError.httpError(code, data) {
            if let parsed = try? JSONDecoder().decode(ErrorBody.self, from: data), let msg = parsed.message {
                throw APIError(message: msg)
            }
            throw APIError(message: "İşlem tamamlanamadı (\(code)). Lütfen tekrar deneyin.")
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError(message: "Bağlantı hatası. İnternet bağlantınızı kontrol edin.")
        }
    }

    // MARK: Auth / Profile

    nonisolated struct RegisterRequest: Encodable, Sendable {
        let action = "register"
        let fullName: String
        let email: String
        let phone: String
        let password: String
    }

    static func register(fullName: String, email: String, phone: String, password: String) async throws {
        let _: RegisterResponse = try await invoke(
            "auth-client",
            body: RegisterRequest(fullName: fullName, email: email, phone: phone, password: password)
        )
    }

    nonisolated struct GetProfileRequest: Encodable, Sendable {
        let action = "get"
        let metadata: Metadata?
        nonisolated struct Metadata: Encodable, Sendable {
            let fullName: String?
            let phone: String?
        }
    }

    static func getProfile(fullName: String? = nil, phone: String? = nil) async throws -> ClientUser? {
        let res: ClientUserResponse = try await invoke(
            "auth-client",
            body: GetProfileRequest(metadata: .init(fullName: fullName, phone: phone))
        )
        return res.clientUser
    }

    nonisolated struct UpdateProfileRequest: Encodable, Sendable {
        let action = "update"
        let fullName: String?
        let phone: String?
        let address: String?
        let city: String?
        let locationLat: Double?
        let locationLng: Double?
    }

    static func updateProfile(
        fullName: String? = nil,
        phone: String? = nil,
        address: String? = nil,
        city: String? = nil,
        locationLat: Double? = nil,
        locationLng: Double? = nil
    ) async throws -> ClientUser? {
        let res: ClientUserResponse = try await invoke(
            "auth-client",
            body: UpdateProfileRequest(
                fullName: fullName, phone: phone, address: address,
                city: city, locationLat: locationLat, locationLng: locationLng
            )
        )
        return res.clientUser
    }

    // MARK: Catalog

    nonisolated struct DiscoveryRequest: Encodable, Sendable {
        let action = "discovery"
        let lat: Double?
        let lng: Double?
    }

    static func discovery(lat: Double?, lng: Double?) async throws -> DiscoveryResponse {
        try await invoke("catalog", body: DiscoveryRequest(lat: lat, lng: lng))
    }

    nonisolated struct SearchFilters: Encodable, Sendable {
        var specialty: String?
        var service: String?
        var maxDistanceKm: Double?
        var minRating: Double?
        var availableToday: Bool?
        var maxPrice: Double?
        var clinicName: String?
        var doctorName: String?
    }

    nonisolated struct SearchRequest: Encodable, Sendable {
        let action = "search"
        let lat: Double?
        let lng: Double?
        let query: String?
        let filters: SearchFilters
        let sort: String
    }

    static func search(lat: Double?, lng: Double?, query: String?, filters: SearchFilters, sort: String) async throws -> [Provider] {
        let res: SearchResponse = try await invoke(
            "catalog",
            body: SearchRequest(lat: lat, lng: lng, query: query, filters: filters, sort: sort)
        )
        return res.providers
    }

    nonisolated struct ClinicRequest: Encodable, Sendable {
        let action = "clinic"
        let businessId: String
        let lat: Double?
        let lng: Double?
    }

    static func clinic(businessId: String, lat: Double?, lng: Double?) async throws -> ClinicResponse {
        try await invoke("catalog", body: ClinicRequest(businessId: businessId, lat: lat, lng: lng))
    }

    nonisolated struct DoctorRequest: Encodable, Sendable {
        let action = "doctor"
        let staffId: String
        let lat: Double?
        let lng: Double?
    }

    static func doctor(staffId: String, lat: Double?, lng: Double?) async throws -> DoctorResponse {
        try await invoke("catalog", body: DoctorRequest(staffId: staffId, lat: lat, lng: lng))
    }

    nonisolated struct SlotsRequest: Encodable, Sendable {
        let action = "slots"
        let staffId: String
        let serviceId: String
        let date: String
    }

    static func slots(staffId: String, serviceId: String, date: String) async throws -> [SlotItem] {
        let res: SlotsResponse = try await invoke(
            "catalog",
            body: SlotsRequest(staffId: staffId, serviceId: serviceId, date: date)
        )
        return res.slots
    }

    // MARK: Booking

    nonisolated struct BookRequest: Encodable, Sendable {
        let action = "book"
        let businessId: String
        let staffId: String
        let serviceId: String
        let date: String
        let startTime: String
        let note: String?
        let contactPhone: String?
    }

    static func book(
        businessId: String, staffId: String, serviceId: String,
        date: String, startTime: String, note: String?, contactPhone: String?
    ) async throws -> BookingResponse {
        try await invoke(
            "booking",
            body: BookRequest(
                businessId: businessId, staffId: staffId, serviceId: serviceId,
                date: date, startTime: startTime, note: note, contactPhone: contactPhone
            )
        )
    }

    nonisolated struct ListRequest: Encodable, Sendable { let action = "list" }

    static func myAppointments() async throws -> [AppointmentRow] {
        let res: AppointmentsResponse = try await invoke("booking", body: ListRequest())
        return res.appointments
    }

    nonisolated struct CancelRequest: Encodable, Sendable {
        let action = "cancel"
        let appointmentId: String
    }

    static func cancel(appointmentId: String) async throws {
        let _: OkResponse = try await invoke("booking", body: CancelRequest(appointmentId: appointmentId))
    }

    // MARK: Engagement

    nonisolated struct NotificationsRequest: Encodable, Sendable { let action = "notifications" }

    static func notifications() async throws -> NotificationsResponse {
        try await invoke("engagement", body: NotificationsRequest())
    }

    nonisolated struct MarkReadRequest: Encodable, Sendable {
        let action = "mark_read"
        let id: String
    }

    static func markRead(id: String) async throws {
        let _: OkResponse = try await invoke("engagement", body: MarkReadRequest(id: id))
    }

    nonisolated struct MarkAllReadRequest: Encodable, Sendable { let action = "mark_all_read" }

    static func markAllRead() async throws {
        let _: OkResponse = try await invoke("engagement", body: MarkAllReadRequest())
    }

    nonisolated struct ReviewRequest: Encodable, Sendable {
        let action = "review"
        let appointmentId: String
        let rating: Int
        let comment: String?
        let serviceQuality: Int?
        let waitingTime: Int?
        let communication: Int?
    }

    static func submitReview(
        appointmentId: String, rating: Int, comment: String?,
        serviceQuality: Int?, waitingTime: Int?, communication: Int?
    ) async throws {
        let _: OkResponse = try await invoke(
            "engagement",
            body: ReviewRequest(
                appointmentId: appointmentId, rating: rating, comment: comment,
                serviceQuality: serviceQuality, waitingTime: waitingTime, communication: communication
            )
        )
    }
}
