import Foundation
import SwiftUI
import Supabase

/// Owns auth session + the linked ClientUser profile, and drives top-level routing.
@MainActor
@Observable
final class AuthManager {
    enum Phase: Equatable {
        case loading
        case unauthenticated
        case onboardingLocation
        case ready
    }

    var phase: Phase = .loading
    var clientUser: ClientUser?
    var isWorking = false
    var locationSkippedThisSession = false

    func bootstrap() async {
        do {
            _ = try await supabase.auth.session
            await loadProfileAndRoute()
        } catch {
            phase = .unauthenticated
        }
    }

    private func loadProfileAndRoute() async {
        do {
            let profile = try await APIService.getProfile()
            clientUser = profile
            if let profile, profile.hasLocation || locationSkippedThisSession {
                phase = .ready
            } else {
                phase = .onboardingLocation
            }
        } catch {
            // Authenticated but profile fetch failed — still let them in; profile retries later.
            phase = .ready
        }
    }

    func signIn(email: String, password: String) async throws {
        isWorking = true
        defer { isWorking = false }
        try await supabase.auth.signIn(email: email.trimmingCharacters(in: .whitespaces).lowercased(), password: password)
        await loadProfileAndRoute()
    }

    func register(fullName: String, email: String, phone: String, password: String) async throws {
        isWorking = true
        defer { isWorking = false }
        let cleanEmail = email.trimmingCharacters(in: .whitespaces).lowercased()
        try await APIService.register(fullName: fullName, email: cleanEmail, phone: phone, password: password)
        try await supabase.auth.signIn(email: cleanEmail, password: password)
        clientUser = try await APIService.getProfile(fullName: fullName, phone: phone)
        phase = .onboardingLocation
    }

    func saveLocation(lat: Double, lng: Double, city: String?, address: String?) async {
        do {
            clientUser = try await APIService.updateProfile(
                city: city, locationLat: lat, locationLng: lng
            )
        } catch {
            print("saveLocation failed: \(error)")
        }
        phase = .ready
    }

    func saveCity(_ city: String, lat: Double?, lng: Double?) async {
        do {
            clientUser = try await APIService.updateProfile(city: city, locationLat: lat, locationLng: lng)
        } catch {
            print("saveCity failed: \(error)")
        }
        phase = .ready
    }

    func skipLocation() {
        locationSkippedThisSession = true
        phase = .ready
    }

    func refreshProfile() async {
        if let updated = try? await APIService.getProfile() {
            clientUser = updated
        }
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        clientUser = nil
        locationSkippedThisSession = false
        phase = .unauthenticated
    }

    var coordinate: (lat: Double, lng: Double)? {
        guard let lat = clientUser?.locationLat, let lng = clientUser?.locationLng else { return nil }
        return (lat, lng)
    }
}
